import { UtilityAnalysisService } from '../services/utility-analysis.service';
import { AnalysisData, CodeNode } from '../types/utility-analysis';

describe('UtilityAnalysisService', () => {
  let service: UtilityAnalysisService;

  beforeEach(() => {
    service = new UtilityAnalysisService();
  });

  describe('analyzeUtilityFunctions', () => {
    it('should classify simple utility functions correctly', () => {
      const mockData: AnalysisData = {
        graphNodes: [
          {
            id: 'test1',
            label: 'format_string',
            type: 'Function',
            code: 'def format_string(text):\n    return text.strip().lower()'
          },
          {
            id: 'test2',
            label: 'create_user_endpoint',
            type: 'Method',
            code: '@app.post("/users")\ndef create_user_endpoint(user_data):\n    # Business logic\n    user = User(user_data)\n    db.save(user)\n    return user'
          }
        ]
      };

      const result = service.analyzeUtilityFunctions(mockData);

      expect(result.functions).toHaveLength(2);
      expect(result.summary.totalFunctions).toBe(2);

      // Find the functions
      const utilityFunc = result.functions.find(f => f.label === 'format_string');
      const businessFunc = result.functions.find(f => f.label === 'create_user_endpoint');

      // Utility function should have higher utility score
      expect(utilityFunc?.utilityScore).toBeGreaterThan(0.3);
      expect(utilityFunc?.classification).toBe('utility');

      // Business function should have higher business relevance
      expect(businessFunc?.businessRelevanceScore).toBeGreaterThan(0.4);
      expect(businessFunc?.classification).toBe('business-logic');
    });

    it('should handle empty input gracefully', () => {
      const mockData: AnalysisData = {
        graphNodes: []
      };

      const result = service.analyzeUtilityFunctions(mockData);

      expect(result.functions).toHaveLength(0);
      expect(result.summary.totalFunctions).toBe(0);
    });

    it('should filter out non-code nodes', () => {
      const mockData: AnalysisData = {
        graphNodes: [
          {
            id: 'file1',
            label: 'utils.py',
            type: 'File',
            code: null
          },
          {
            id: 'func1',
            label: 'test_function',
            type: 'Function',
            code: 'def test_function():\n    return True'
          }
        ]
      };

      const result = service.analyzeUtilityFunctions(mockData);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].label).toBe('test_function');
    });
  });

  describe('helper methods', () => {
    it('should filter by classification correctly', () => {
      const mockResult = {
        functions: [
          { classification: 'business-logic', label: 'func1' } as any,
          { classification: 'utility', label: 'func2' } as any,
          { classification: 'business-logic', label: 'func3' } as any
        ],
        summary: {} as any
      };

      const businessFunctions = service.filterByClassification(mockResult, 'business-logic');
      const utilityFunctions = service.filterByClassification(mockResult, 'utility');

      expect(businessFunctions).toHaveLength(2);
      expect(utilityFunctions).toHaveLength(1);
      expect(businessFunctions[0].label).toBe('func1');
      expect(utilityFunctions[0].label).toBe('func2');
    });

    it('should get top important functions', () => {
      const mockResult = {
        functions: [
          { importanceScore: 0.9, label: 'func1' } as any,
          { importanceScore: 0.7, label: 'func2' } as any,
          { importanceScore: 0.5, label: 'func3' } as any
        ],
        summary: {} as any
      };

      const topFunctions = service.getTopImportantFunctions(mockResult, 2);

      expect(topFunctions).toHaveLength(2);
      expect(topFunctions[0].label).toBe('func1');
      expect(topFunctions[1].label).toBe('func2');
    });
  });
});