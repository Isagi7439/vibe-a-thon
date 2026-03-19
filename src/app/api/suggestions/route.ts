import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let suggestions: string[] = [];

    // Fetch trending phone models from the internet
    const serperApiKey = process.env.SERPER_API_KEY;

    if (serperApiKey) {
      try {
        // Search for currently popular/trending smartphone models
        const response = await axios.post(
          'https://google.serper.dev/news',
          {
            q: 'best smartphones 2025 latest trending models reviews',
            num: 50,
          },
          {
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        // Extract model names from search results
        if (response.data.news && Array.isArray(response.data.news)) {
          const modelSet = new Set<string>();
          
          response.data.news.forEach((item: any) => {
            const title = item.title || '';
            
            // Common phone model patterns
            const phonePatterns = [
              /iPhone\s+\d+(?:\s+Pro(?:\s+Max)?)?/gi,
              /Samsung\s+Galaxy\s+S\d+(?:\s+Ultra|\+)?/gi,
              /Google\s+Pixel\s+\d+(?:\s+Pro)?/gi,
              /OnePlus\s+\d+(?:[A-Z]+)?/gi,
              /Xiaomi\s+\d+(?:\s+Ultra)?/gi,
              /Nothing\s+Phone\s+\d+/gi,
              /Motorola\s+Edge\s+\d+(?:\s+Pro)?/gi,
              /Vivo\s+X\d+(?:\s+Pro)?/gi,
              /OPPO\s+(?:Find\s+)?[A-Z0-9]+(?:\s+Pro)?/gi,
              /Realme\s+GT\s+\d+(?:\s+Pro)?/gi,
              /Poco\s+X\d+(?:\s+Pro)?/gi,
            ];

            phonePatterns.forEach(pattern => {
              const matches = title.match(pattern);
              if (matches) {
                matches.forEach((match: string) => {
                  const cleaned = match.trim();
                  if (cleaned.length > 3 && cleaned.length < 50) {
                    modelSet.add(cleaned);
                  }
                });
              }
            });
          });

          suggestions = Array.from(modelSet);
        }
      } catch (serperError) {
        console.warn('Serper API error:', serperError);
      }
    }

    // Fallback: Return currently popular phone models
    const trendingModels = [
      'iPhone 15 Pro Max',
      'iPhone 15 Pro',
      'iPhone 15',
      'iPhone 14 Pro Max',
      'iPhone 14 Pro',
      'iPhone 14',
      'iPhone 13 Pro Max',
      'iPhone 13 Pro',
      'iPhone 13',
      'iPhone 12 Pro Max',
      'Samsung Galaxy S24 Ultra',
      'Samsung Galaxy S24+',
      'Samsung Galaxy S24',
      'Samsung Galaxy S23 Ultra',
      'Samsung Galaxy S23+',
      'Samsung Galaxy S23',
      'Samsung Galaxy A54',
      'Samsung Galaxy A34',
      'Google Pixel 8 Pro',
      'Google Pixel 8',
      'Google Pixel 7 Pro',
      'Google Pixel 7',
      'Google Pixel 7a',
      'OnePlus 12',
      'OnePlus 12R',
      'OnePlus 11',
      'OnePlus 11 Pro',
      'Xiaomi 14 Ultra',
      'Xiaomi 14 Pro',
      'Xiaomi 14',
      'Xiaomi 13 Ultra',
      'Xiaomi 13 Pro',
      'Nothing Phone 2',
      'Nothing Phone 1',
      'Motorola Edge 50 Pro',
      'Motorola Edge 40 Pro',
      'Motorola Edge 40',
      'Vivo X100 Pro',
      'Vivo X100',
      'Vivo X90 Pro+',
      'Vivo X90 Pro',
      'OPPO Find X7',
      'OPPO Find X6 Pro',
      'OPPO Reno 11 Pro',
      'OPPO Reno 11',
      'Realme GT 6',
      'Realme GT 5',
      'Realme GT 5 Pro',
      'Poco X7 Pro',
      'Poco X7',
      'Poco F6',
      'Poco F6 Pro',
      'Honor 200 Pro',
      'Honor 200',
      'HTC U24 Pro',
      'Sony Xperia 5 V',
      'Sony Xperia 1 VI',
    ];

    // If no suggestions from API, return all trending models
    if (suggestions.length === 0) {
      suggestions = trendingModels;
    } else {
      // Combine API results with trending models to show as many as possible
      const combined = [...new Set([...suggestions, ...trendingModels])];
      suggestions = combined;
    }

    // Filter by query if provided (user is looking for something specific within trending)
    if (query && query.trim().length > 0) {
      suggestions = suggestions.filter((model) =>
        model.toLowerCase().includes(query.toLowerCase())
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
