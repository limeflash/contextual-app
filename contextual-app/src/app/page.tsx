"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Categorization {
  id: number;
  input_text: string;
  category: string;
  description: string;
  tags: string[];
}

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState(0)
  const [recentCategorizations, setRecentCategorizations] = useState<Categorization[]>([])

  useEffect(() => {
    fetchRecentCategorizations()
  }, [])

  const fetchRecentCategorizations = async () => {
    try {
      const response = await fetch('/api/get-categorizations')
      if (response.ok) {
        const data = await response.json()
        setRecentCategorizations(data)
      } else {
        throw new Error('Failed to fetch recent categorizations')
      }
    } catch (err) {
      console.error('Error fetching recent categorizations:', err)
      setError('Failed to fetch recent categorizations')
    }
  }

  const handleCategorize = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that categorizes text. Provide 10 relevant tags for the given text, then choose the most appropriate category based on context and best for text category. Respond in the following format:\nTags/Теги: [comma-separated list of 10 tags]\nCategory/Категория: [chosen category]\nDescription/Описание: [brief description] Respond in the same language as the input text (English or Russian only)."
            },
            { role: "user", content: `Categorize the following text:\n\n${inputText}` }
          ]
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
      }

      console.log("Full response:", fullContent);

      // Parse all JSON objects in the response
      const jsonObjects = fullContent.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));

      // Combine all content from the messages
      const combinedContent = jsonObjects
        .filter(obj => obj.message && obj.message.content)
        .map(obj => obj.message.content)
        .join('');

      console.log("Combined content:", combinedContent);

      const tagsMatch = combinedContent.match(/(?:Tags|Теги):\s*(.+)/);
      const categoryMatch = combinedContent.match(/(?:Category|Категория):\s*(.+)/);
      const descriptionMatch = combinedContent.match(/(?:Description|Описание):\s*(.+)/);

      console.log("Matches:", { tagsMatch, categoryMatch, descriptionMatch });

      if (!tagsMatch || !categoryMatch || !descriptionMatch) {
        throw new Error('Response format is not recognized. Please use English or Russian.');
      }

      setTags(tagsMatch[1].split(',').map(tag => tag.trim()));
      setCategory(categoryMatch[1].trim());
      setDescription(descriptionMatch[1].trim());

      const dbResponse = await fetch('/api/store-categorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          category: categoryMatch[1].trim(),
          description: descriptionMatch[1].trim(),
          tags: tagsMatch[1].split(',').map(tag => tag.trim()),
        }),
      });

      if (!dbResponse.ok) throw new Error('Failed to store categorization in the database');

      fetchRecentCategorizations();
    } catch (err: any) {
      console.error('Error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setExecutionTime(performance.now() - startTime);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/delete-categorization', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setRecentCategorizations(prev => prev.filter(cat => cat.id !== id));
      } else {
        throw new Error('Failed to delete categorization');
      }
    } catch (err: any) {
      console.error('Error deleting categorization:', err);
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Text Categorisation Using Local AI Model</h1>
      <Card>
        <CardHeader>
          <CardTitle>Enter Text to Categorize</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your text here..."
            className="mb-4"
          />
          <Button onClick={handleCategorize} disabled={loading}>
            {loading ? "Categorizing..." : "Categorize"}
          </Button>
          <div className="mt-4 text-sm">Execution Time: {executionTime.toFixed(2)} ms</div>
          {error && <div className="mt-4 p-3 bg-destructive text-destructive-foreground rounded">{error}</div>}
          {category && <div className="mt-4 p-3 bg-primary text-primary-foreground rounded">Category: {category}</div>}
          {description && <div className="mt-4 p-3 bg-secondary text-secondary-foreground rounded">Description: {description}</div>}
          {tags.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">Tags:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => {
                  const { bg, text } = getRandomColor();
                  return (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className={`${bg} ${text}`}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent Categorizations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {recentCategorizations.map((cat) => (
              <li key={cat.id} className="border bg-zinc-900 border-zinc-800 rounded-lg p-4 relative">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="text">
                    <AccordionTrigger>Text</AccordionTrigger>
                    <AccordionContent>
                      {cat.input_text}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="category">
                    <AccordionTrigger>
                      {cat.category && typeof cat.category === 'string' && cat.category.includes('Category') ? 'Category' : 'Категория'}
                    </AccordionTrigger>
                    <AccordionContent>
                      {cat.category}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="description">
                    <AccordionTrigger>
                      {cat.description && typeof cat.description === 'string' && cat.description.includes('Description') ? 'Description' : 'Описание'}
                    </AccordionTrigger>
                    <AccordionContent>
                      {cat.description}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="mt-4">
                  <strong className="text-zinc-100">
                    {Array.isArray(cat.tags) && cat.tags.length > 0 && typeof cat.tags[0] === 'string'
                      ? (cat.tags[0].includes('Tags') ? 'Tags:' : 'Теги:')
                      : 'Tags/Теги:'}
                  </strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(cat.tags) ? cat.tags.map((tag, index) => {
                      const { bg, text } = getRandomColor();
                      return (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className={`${bg} ${text}`}
                        >
                          {tag}
                        </Badge>
                      );
                    }) : ''}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

const tailwindColors = [
  'red', 'orange', 'amber', 
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 
  'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

const getRandomColor = () => {
  const colorName = tailwindColors[Math.floor(Math.random() * tailwindColors.length)];
  const bgShade = [500, 600, 700][Math.floor(Math.random() * 3)]; // Use medium shades for background
  const textShade = 100; // Always use light text for contrast
  return {
    bg: `bg-${colorName}-${bgShade}`,
    text: `text-${colorName}-${textShade}`
  };
};