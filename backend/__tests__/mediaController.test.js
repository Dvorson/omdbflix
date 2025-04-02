"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mediaController = __importStar(require("../src/controllers/mediaController"));
const mediaService = __importStar(require("../src/services/mediaService"));
// Mock the mediaService module
jest.mock('../src/services/mediaService');
describe('Media Controller', () => {
    let mockRequest;
    let mockResponse;
    let responseObject = {};
    beforeEach(() => {
        mockRequest = {};
        responseObject = {
            statusCode: 0,
            json: jest.fn().mockReturnValue(this)
        };
        mockResponse = {
            json: jest.fn().mockImplementation(result => {
                responseObject.json = result;
                return responseObject;
            }),
            status: jest.fn().mockImplementation(code => {
                responseObject.statusCode = code;
                return mockResponse;
            })
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('searchMediaController', () => {
        it('should return search results when valid query is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const mockSearchResults = {
                Search: [
                    {
                        Title: 'Test Movie',
                        Year: '2020',
                        imdbID: 'tt1234567',
                        Type: 'movie',
                        Poster: 'https://example.com/poster.jpg'
                    }
                ],
                totalResults: '1',
                Response: 'True'
            };
            mockRequest.query = { query: 'test' };
            mediaService.searchMedia.mockResolvedValue(mockSearchResults);
            // Act
            yield mediaController.searchMediaController(mockRequest, mockResponse);
            // Assert
            expect(mediaService.searchMedia).toHaveBeenCalledWith({
                query: 'test',
                type: undefined,
                year: undefined,
                page: 1
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResults);
        }));
        it('should return 400 when query is not provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            mockRequest.query = {};
            // Act
            yield mediaController.searchMediaController(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Search query is required' });
        }));
        it('should return 500 when service throws an error', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            mockRequest.query = { query: 'test' };
            const error = new Error('Service error');
            mediaService.searchMedia.mockRejectedValue(error);
            // Act
            yield mediaController.searchMediaController(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        }));
    });
    describe('getMediaByIdController', () => {
        it('should return media details when valid ID is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const mockMediaDetails = {
                Title: 'Test Movie',
                Year: '2020',
                imdbID: 'tt1234567',
                Type: 'movie',
                Poster: 'https://example.com/poster.jpg',
                Plot: 'A test movie plot',
                Director: 'Test Director',
                Rated: 'PG-13',
                Released: '01 Jan 2020',
                Runtime: '120 min',
                Genre: 'Action',
                Writer: 'Test Writer',
                Actors: 'Actor 1, Actor 2',
                Language: 'English',
                Country: 'USA',
                Awards: 'None',
                Ratings: [{ Source: 'Internet Movie Database', Value: '8.0/10' }],
                Metascore: '75',
                imdbRating: '8.0',
                imdbVotes: '1000'
            };
            mockRequest.params = { id: 'tt1234567' };
            mediaService.getMediaById.mockResolvedValue(mockMediaDetails);
            // Act
            yield mediaController.getMediaByIdController(mockRequest, mockResponse);
            // Assert
            expect(mediaService.getMediaById).toHaveBeenCalledWith('tt1234567');
            expect(mockResponse.json).toHaveBeenCalledWith(mockMediaDetails);
        }));
        it('should return 404 when media is not found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            mockRequest.params = { id: 'invalid-id' };
            const error = new mediaService.MediaServiceError('Media not found', 404);
            mediaService.getMediaById.mockRejectedValue(error);
            // Act
            yield mediaController.getMediaByIdController(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Media not found' });
        }));
        it('should return 500 when service throws an error', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            mockRequest.params = { id: 'tt1234567' };
            const error = new Error('Service error');
            mediaService.getMediaById.mockRejectedValue(error);
            // Act
            yield mediaController.getMediaByIdController(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        }));
    });
});
