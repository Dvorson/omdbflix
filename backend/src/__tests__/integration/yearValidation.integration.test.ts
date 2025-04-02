import request from 'supertest';
import app from '../../app';
import { config } from '../../utils/config';

describe('Media API Year Validation Integration Test', () => {
  it('should reject search with invalid year parameter "Cuts"', async () => {
    const response = await request(app)
      .get('/api/media/search')
      .query({
        query: 'Star Wars',
        year: 'Cuts' // This previously caused SQL conversion error
      });
      
    // Should get 400 Bad Request, not 500 Internal Server Error
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Year must be a valid 4-digit year');
  });
  
  // Skip this test if no API key is available (common in CI environments)
  (config.omdbApiKey ? it : it.skip)('should accept search with valid year parameter', async () => {
    const response = await request(app)
      .get('/api/media/search')
      .query({
        query: 'Star Wars',
        year: '1977'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.Response).toBe('True');
  });
}); 