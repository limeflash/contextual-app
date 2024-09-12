export default class KNNClassifier {
  private k: number;
  private data: Array<{ tags: string[], category: string }>;
  private minSimilarityThreshold: number;

  constructor(k: number = 5, minSimilarityThreshold: number = 0.1) {
    this.k = k;
    this.data = [];
    this.minSimilarityThreshold = minSimilarityThreshold;
  }

  addEntry(tags: string[], category: string) {
    this.data.push({ tags, category });
  }

  predict(queryTags: string[]): string {
    if (this.data.length === 0) return '';

    const similarities = this.data.map(entry => ({
      similarity: this.calculateSimilarity(queryTags, entry.tags),
      category: entry.category
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    const kNearest = similarities.slice(0, this.k);
    console.log("K nearest neighbors:", kNearest);

    if (kNearest[0].similarity < this.minSimilarityThreshold) {
      console.log("No similar entries found above threshold");
      return '';
    }

    const categoryCount: { [key: string]: number } = {};
    kNearest.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + item.similarity;
    });

    let maxCount = 0;
    let predictedCategory = '';

    for (const category in categoryCount) {
      if (categoryCount[category] > maxCount) {
        maxCount = categoryCount[category];
        predictedCategory = category;
      }
    }

    return predictedCategory;
  }

  private calculateSimilarity(tags1: string[], tags2: string[]): number {
    const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
    
    let matchCount = 0;
    set1.forEach(tag => {
      if (set2.has(tag)) matchCount++;
      else {
        for (const tag2 of set2) {
          if (tag.includes(tag2) || tag2.includes(tag)) {
            matchCount += 0.5;
            break;
          }
        }
      }
    });

    return matchCount / Math.max(set1.size, set2.size);
  }
}
