"use client";

import React, { useState } from 'react';
import { UserRequirements, RankedPhone, PhoneSpecs } from '../types';

export default function Home() {
  // Tab State
  const [activeTab, setActiveTab] = useState<'match' | 'compare'>('match');
  
  // SmartMatch State
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [results, setResults] = useState<{ phones: RankedPhone[], hash: string, suggestion?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search & Compare Models State
  const [searchResult, setSearchResult] = useState<PhoneSpecs | null>(null);
  const [searchHistory, setSearchHistory] = useState<PhoneSpecs[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [devicesToCompare, setDevicesToCompare] = useState<PhoneSpecs[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Popular phone models database (fallback)
  const popularModels = [
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'Samsung Galaxy S24 Ultra',
    'Samsung Galaxy S24+',
    'Samsung Galaxy S24',
    'Samsung Galaxy S23 Ultra',
    'Google Pixel 8 Pro',
    'Google Pixel 8',
    'OnePlus 12',
    'OnePlus 12R',
    'Xiaomi 14 Ultra',
    'Xiaomi 14',
    'Nothing Phone 2',
    'Motorola Edge 50 Pro',
    'Vivo X100 Pro',
    'OPPO Find X7',
    'Realme GT 6',
    'Poco X7 Pro',
  ];

  const [form, setForm] = useState<Partial<UserRequirements>>({
    budget: "₹25,000-₹50,000",
    processor: "Snapdragon",
    minRam: 8,
    minStorage: 128,
    cameraPriority: "medium",
    usageType: "all-rounder"
  });

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingText("Initializing AI Agent...");
    setError(null);

    try {
      setTimeout(() => setLoadingText("Searching the internet for latest phones..."), 2000);
      setTimeout(() => setLoadingText("AI resolving requirements and ranking candidates..."), 6000);
      setTimeout(() => setLoadingText("Logging recommendation on-chain securely..."), 12000);
      
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setResults({ phones: data.results, hash: data.reportHash, suggestion: data.suggestion });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestions = () => {
    switch(step) {
      case 0:
        return (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>What is your budget?</h2>
            <div className="form-group">
              <label className="form-label">Budget Range</label>
              <input 
                type="text" 
                className="form-input" 
                value={form.budget} 
                onChange={e => setForm({...form, budget: e.target.value})}
                placeholder="e.g. ₹40,000-₹80,000"
              />
            </div>
            <button className="button-primary" onClick={handleNext}>Next &rarr;</button>
          </div>
        );
      case 1:
        return (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Performance Needs</h2>
            <div className="form-group">
              <label className="form-label">Preferred Processor</label>
              <select className="form-select" value={form.processor} onChange={e => setForm({...form, processor: e.target.value})}>
                <option value="Snapdragon">Snapdragon (Qualcomm)</option>
                <option value="MediaTek">MediaTek (Dimensity)</option>
                <option value="Apple">Apple (A-series)</option>
                <option value="Google Tensor">Google Tensor</option>
                <option value="Any">No preference</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button className="button-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={handlePrev}>&larr; Back</button>
              <button className="button-primary" onClick={handleNext}>Next &rarr;</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Memory & Storage</h2>
            <div className="form-group">
              <label className="form-label">Minimum RAM (GB)</label>
              <select className="form-select" value={form.minRam} onChange={e => setForm({...form, minRam: parseInt(e.target.value)})}>
                <option value="4">4 GB</option>
                <option value="6">6 GB</option>
                <option value="8">8 GB</option>
                <option value="12">12 GB</option>
                <option value="16">16 GB</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Storage (GB)</label>
              <select className="form-select" value={form.minStorage} onChange={e => setForm({...form, minStorage: parseInt(e.target.value)})}>
                <option value="64">64 GB</option>
                <option value="128">128 GB</option>
                <option value="256">256 GB</option>
                <option value="512">512 GB</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button className="button-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={handlePrev}>&larr; Back</button>
              <button className="button-primary" onClick={handleNext}>Next &rarr;</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Camera & Usage</h2>
            <div className="form-group">
              <label className="form-label">Camera Priority</label>
              <select className="form-select" value={form.cameraPriority} onChange={e => setForm({...form, cameraPriority: e.target.value as any})}>
                <option value="low">Low - Basic camera</option>
                <option value="medium">Medium - Everyday shots</option>
                <option value="high">High - Great camera</option>
                <option value="flagship">Flagship - Absolute best</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Usage Type</label>
              <select className="form-select" value={form.usageType} onChange={e => setForm({...form, usageType: e.target.value as any})}>
                <option value="gaming">Gaming</option>
                <option value="photography">Photography</option>
                <option value="casual">Casual Use</option>
                <option value="all-rounder">All-Rounder</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button className="button-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={handlePrev}>&larr; Back</button>
              <button className="button-primary pulse-glow" onClick={handleSubmit}>Find My Phone</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderLoading = () => (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
      <div className="pulse-glow" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-glow)', margin: '0 auto 2rem' }}></div>
      <h2 style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}>{loadingText}</h2>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;
    
    if (results.phones.length === 0 && results.suggestion) {
      return (
        <div className="animate-fade-in glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderColor: 'rgba(255, 107, 107, 0.3)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤔</div>
          <h2 style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '2rem' }}>No Perfect Match Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            {results.suggestion}
          </p>
          <button className="button-primary" onClick={() => { setResults(null); setStep(0); }}>Adjust Requirements</button>
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Top Smartphone Picks Match Your Vibe</h2>
          <button className="button-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => { setResults(null); setStep(0); }}>Start Over</button>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>On-Chain Validation Hash:</strong> {results.hash}
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {results.phones.map((phone, idx) => (
            <div key={idx} className="glass-panel" style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
              
              {/* Phone Image Column */}
              <div style={{ flexShrink: 0, width: '140px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={`https://tse1.mm.bing.net/th?q=${encodeURIComponent(phone.model + ' smartphone front view official')}&w=200&h=300&c=7&rs=1&p=0`} 
                  alt={phone.model}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  title={phone.model}
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'; 
                    (e.target as HTMLImageElement).style.objectFit = 'contain'; 
                    (e.target as HTMLImageElement).style.padding = '20px'; 
                  }}
                />
              </div>

              {/* Phone Details Column */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.5rem', color: idx === 0 ? 'var(--accent-color)' : 'white' }}>
                  #{idx + 1} {phone.model}
                </h3>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: 'bold' }}>
                  Rank: #{phone.rank}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{phone.summary}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price Est.</div>
                  <div style={{ fontWeight: 'bold' }}>{phone.price || 'N/A'}</div>
                </div>
                <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Processor</div>
                  <div style={{ fontWeight: 'bold' }}>{phone.processor || 'N/A'}</div>
                </div>
                <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RAM / Storage</div>
                  <div style={{ fontWeight: 'bold' }}>{phone.ram || 'N/A'} / {phone.storage || 'N/A'}</div>
                </div>
                <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Camera</div>
                  <div style={{ fontWeight: 'bold' }}>{phone.camera || 'N/A'}</div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <a 
                  href={phone.purchase_link || `https://www.google.com/search?q=Buy+${encodeURIComponent(phone.model)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="button-primary"
                  style={{ textDecoration: 'none', display: 'inline-block', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                >
                  Buy Now &rarr;
                </a>
              </div>
            </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSearchSpecs = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_query: searchQuery.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch specs');
      
      // Add to search history
      const newHistory = searchHistory.slice(0, historyIndex + 1);
      newHistory.push(data.specs);
      setSearchHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setSearchResult(data.specs);
      setSearchQuery('');
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSearchResult(searchHistory[newIndex]);
      setSearchQuery('');
    }
  };

  const goForward = () => {
    if (historyIndex < searchHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSearchResult(searchHistory[newIndex]);
      setSearchQuery('');
    }
  };

  const addToCompare = () => {
    if (searchResult && !devicesToCompare.find(p => p.model.toLowerCase() === searchResult.model.toLowerCase())) {
      setDevicesToCompare(prev => [...prev, searchResult]);
      setSearchResult(null);
      setSearchQuery('');
    }
  };

  const removeFromCompare = (model: string) => {
    setDevicesToCompare(prev => prev.filter(p => p.model !== model));
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);

    if (value.trim().length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Show loading state and suggestions immediately (Google-like behavior)
    setSuggestionsLoading(true);
    setShowSuggestions(true);

    // Debounce API call to avoid excessive requests while typing
    const timeoutId = setTimeout(() => {
      fetch(`/api/suggestions?q=${encodeURIComponent(value.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          } else {
            // Fallback to matching popular models
            const filtered = popularModels.filter(model =>
              model.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
          }
        })
        .catch(err => {
          console.error('Failed to fetch suggestions:', err);
          // Fallback to matching popular models
          const filtered = popularModels.filter(model =>
            model.toLowerCase().includes(value.toLowerCase())
          );
          setSuggestions(filtered);
        })
        .finally(() => setSuggestionsLoading(false));
    }, 200);

    return () => clearTimeout(timeoutId);
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const exitComparisonMode = () => {
    setComparisonMode(false);
  };

  const renderCompareTab = () => {
    // Comparison Table View
    if (comparisonMode && devicesToCompare.length > 0) {
      return (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            <button
              className="button-primary"
              onClick={() => {
                goBack();
                setComparisonMode(false);
              }}
              disabled={historyIndex <= 0}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: historyIndex <= 0 ? 'rgba(255,255,255,0.05)' : undefined, opacity: historyIndex <= 0 ? 0.5 : 1, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer' }}
            >
              ← Back
            </button>
            <button
              className="button-primary"
              onClick={exitComparisonMode}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
            >
              ← Back to Devices
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${devicesToCompare.length}, 1fr)`, gap: '0.5rem', minWidth: '100%' }}>
              
              {/* Spec Names Column */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px 0 0 0' }}>
                SPECS
              </div>

              {/* Phone Cards Header */}
              {devicesToCompare.map((phone, idx) => (
                <div key={`header-${idx}`} style={{ position: 'relative' }}>
                  <div style={{ background: 'rgba(0,255,255,0.1)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '2px solid var(--accent-color)' }}>
                    <button 
                      onClick={() => removeFromCompare(phone.model)}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255,50,50,0.2)', color: '#ff6b6b', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                    >
                      ✕
                    </button>
                    <div style={{ height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <img 
                        src={`https://tse1.mm.bing.net/th?q=${encodeURIComponent(phone.model + ' smartphone front official')}&w=150&h=250&c=7&rs=1&p=0`} 
                        alt={phone.model}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'; }}
                      />
                    </div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--accent-color)', margin: '0.5rem 0 0 0', wordBreak: 'break-word' }}>{phone.model}</h3>
                  </div>
                </div>
              ))}

              {/* Price Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>Price</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`price-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{phone.price}</div>
              ))}

              {/* Processor Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>Processor</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`proc-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.9rem' }}>{phone.processor}</div>
              ))}

              {/* RAM Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>RAM</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`ram-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.9rem' }}>{phone.ram}</div>
              ))}

              {/* Storage Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>Storage</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`storage-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.9rem' }}>{phone.storage}</div>
              ))}

              {/* Display Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>Display</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`display-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.85rem' }}>{phone.display}</div>
              ))}

              {/* Camera Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>Camera</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`camera-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.9rem' }}>{phone.camera}</div>
              ))}

              {/* Battery Row */}
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 0 8px' }}>Battery</div>
              {devicesToCompare.map((phone, idx) => (
                <div key={`battery-${idx}`} style={{ padding: '1rem', background: 'rgba(0,255,255,0.05)', fontSize: '0.9rem', borderRadius: idx === devicesToCompare.length - 1 ? '0 0 8px 0' : '0' }}>{phone.battery}</div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Search and Add to Compare View
    return (
      <div className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Search for a Smartphone Model</h2>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. iPhone 15 Pro Max, Samsung Galaxy S24"
                value={searchQuery}
                onChange={e => handleSearchQueryChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length === 0) {
                    // Fetch latest suggestions from API
                    setSuggestionsLoading(true);
                    fetch(`/api/suggestions`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.suggestions && data.suggestions.length > 0) {
                          setSuggestions(data.suggestions);
                          setShowSuggestions(true);
                        }
                      })
                      .catch(() => {
                        setSuggestions(popularModels);
                        setShowSuggestions(true);
                      })
                      .finally(() => setSuggestionsLoading(false));
                  }
                }}
                onBlur={() => {
                  // Hide suggestions after a short delay to allow clicking
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!showSuggestions) {
                      setShowSuggestions(true);
                      return;
                    }
                    if (e.key === 'ArrowDown') {
                      setSelectedSuggestionIndex(prev => 
                        prev < suggestions.length - 1 ? prev + 1 : prev
                      );
                    } else {
                      setSelectedSuggestionIndex(prev => (prev > -1 ? prev - 1 : -1));
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  } else if (e.key === 'Enter') {
                    if (showSuggestions && selectedSuggestionIndex >= 0) {
                      e.preventDefault();
                      selectSuggestion(suggestions[selectedSuggestionIndex]);
                    } else if (!showSuggestions) {
                      handleSearchSpecs();
                    }
                  } else if (e.key === 'Tab' && showSuggestions && selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    selectSuggestion(suggestions[selectedSuggestionIndex]);
                  }
                }}
                disabled={isSearching}
                style={{ flexGrow: 1, width: '100%' }}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(0,255,255,0.3)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  zIndex: 10,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {suggestionsLoading ? (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      Fetching latest trending models...
                    </div>
                  ) : (
                    <>
                      {suggestions.map((suggestion, idx) => {
                        // Highlight matching text like Google does
                        const query = searchQuery.toLowerCase();
                        const suggestionLower = suggestion.toLowerCase();
                        const matchIndex = suggestionLower.indexOf(query);
                        
                        let displayContent;
                        if (matchIndex !== -1 && query.length > 0) {
                          const before = suggestion.substring(0, matchIndex);
                          const match = suggestion.substring(matchIndex, matchIndex + query.length);
                          const after = suggestion.substring(matchIndex + query.length);
                          displayContent = (
                            <>
                              {before}<strong>{match}</strong>{after}
                            </>
                          );
                        } else {
                          displayContent = suggestion;
                        }

                        return (
                          <div
                            key={idx}
                            onClick={() => selectSuggestion(suggestion)}
                            onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              background: selectedSuggestionIndex === idx ? 'rgba(0,255,255,0.15)' : 'transparent',
                              borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                              color: selectedSuggestionIndex === idx ? 'var(--accent-color)' : 'var(--text-primary)',
                              fontWeight: selectedSuggestionIndex === idx ? '500' : 'normal',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {displayContent}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
            <button className="button-primary" onClick={handleSearchSpecs} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchError && <p style={{ color: '#ff6b6b', marginTop: '0.5rem' }}>{searchError}</p>}
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`https://tse1.mm.bing.net/th?q=${encodeURIComponent(searchResult.model + ' smartphone front official')}&w=150&h=250&c=7&rs=1&p=0`} 
                    alt={searchResult.model}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'; }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <button 
                    className="button-primary"
                    onClick={addToCompare}
                    style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', width: '100%' }}
                  >
                    + Add to Compare
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button 
                      className="button-primary"
                      onClick={goBack}
                      disabled={historyIndex <= 0}
                      style={{ background: historyIndex <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.75rem 1rem', fontSize: '0.9rem', opacity: historyIndex <= 0 ? 0.5 : 1, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer', width: '100%' }}
                    >
                      ← Back
                    </button>
                  </div>
                  <button 
                    className="button-primary"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.75rem 1rem', fontSize: '0.9rem', width: '100%' }}
                    onClick={() => {
                      setSearchResult(null);
                      setSearchQuery('');
                    }}
                  >
                    Search Again
                  </button>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-color)', marginBottom: '1rem' }}>{searchResult.model}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Price</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{searchResult.price}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Processor</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{searchResult.processor}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>RAM</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{searchResult.ram}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Storage</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{searchResult.storage}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Display</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{searchResult.display}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Camera</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{searchResult.camera}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Battery</div>
                  <div style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>{searchResult.battery}</div>

                  {searchResult.key_strengths && searchResult.key_strengths.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Key Strengths</div>
                      <ul style={{ paddingLeft: '1.5rem', margin: '0' }}>
                        {searchResult.key_strengths.map((str, i) => <li key={i} style={{ fontSize: '0.95rem' }}>{str}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <a 
                  href={`https://www.google.com/search?q=Buy+${encodeURIComponent(searchResult.model)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--accent-color)', color: '#000', borderRadius: '99px', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Buy Now →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Devices to Compare */}
        {devicesToCompare.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Added to Compare ({devicesToCompare.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {devicesToCompare.map((phone, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                  <button 
                    onClick={() => removeFromCompare(phone.model)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,50,50,0.2)', color: '#ff6b6b', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
                  >
                    ✕
                  </button>
                  <div style={{ height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={`https://tse1.mm.bing.net/th?q=${encodeURIComponent(phone.model + ' smartphone front')}&w=120&h=200&c=7&rs=1&p=0`} 
                      alt={phone.model}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }}
                    />
                  </div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-color)', marginBottom: '0.8rem', textAlign: 'center' }}>{phone.model}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>{phone.price}</div>
                </div>
              ))}
            </div>

            <button
              className="button-primary"
              onClick={() => setComparisonMode(true)}
              style={{ padding: '1rem 2rem', fontSize: '1rem', width: '100%' }}
            >
              View Comparison Table
            </button>
          </div>
        )}

        {/* Empty State */}
        {!searchResult && devicesToCompare.length === 0 && !isSearching && (
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '4rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📱</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Search for a phone model to get started</p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div className="pulse-glow" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-glow)', margin: '0 auto 2rem' }}></div>
            <h2 style={{ color: 'var(--accent-color)' }}>Analyzing Specs...</h2>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="container" style={{ maxWidth: activeTab === 'compare' ? '1400px' : '800px', transition: 'max-width 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--accent-color)', letterSpacing: '-1px' }}>SmartMatch AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>Discover Your Ultimate Smartphone Companion</p>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('match')}
            style={{ 
              padding: '0.75rem 2rem', 
              borderRadius: '99px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              background: activeTab === 'match' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'match' ? '#000' : 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
          >
            AI Matchmaker
          </button>
          <button 
            onClick={() => setActiveTab('compare')}
            style={{ 
              padding: '0.75rem 2rem', 
              borderRadius: '99px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              background: activeTab === 'compare' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'compare' ? '#000' : 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
          >
            Search
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {activeTab === 'match' ? (
          <>
            {error && (
              <div style={{ background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.3)', color: '#ff6b6b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Error connecting to AI Agent</h4>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}
            {!loading && !results && renderQuestions()}
            {loading && renderLoading()}
            {results && renderResults()}
          </>
        ) : (
          renderCompareTab()
        )}
      </div>
    </main>
  );
}
