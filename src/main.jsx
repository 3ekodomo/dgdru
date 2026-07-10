import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, Search, Volume2, VolumeX, Bookmark, BookmarkCheck, BookOpen, List, Shuffle, ChevronDown, ChevronUp, Image as ImageIcon, Info } from 'lucide-react';

export default function App() {
  const [drugsData, setDrugsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('list');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('name'); 
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  
  // Accordion state for List View
  const [expandedId, setExpandedId] = useState(null);

  // Flashcard state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 1. Fetch Data & Initialize Theme/Bookmarks
  useEffect(() => {
    // Fetch data from GitHub
    fetch('https://raw.githubusercontent.com/3ekodomo/dgdrugs/refs/heads/main/drugsinfo.json')
      .then(res => res.json())
      .then(data => {
        // Handle case where JSON might be wrapped in an object or just an array
        const arr = Array.isArray(data) ? data : (data.drugs || []);
        setDrugsData(arr);
        if (arr.length > 0) {
          setFlashcardIndex(Math.floor(Math.random() * arr.length));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch drugs data:", err);
        setLoading(false);
      });

    // Theme & Bookmarks initialization
    const savedTheme = localStorage.getItem('ayurveda-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    const savedBookmarks = localStorage.getItem('ayurveda-bookmarks');
    if (savedBookmarks) {
      try { setBookmarkedIds(JSON.parse(savedBookmarks)); } catch (e) { }
    }
  }, []);

  // Update DOM when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ayurveda-theme', theme);
  }, [theme]);

  // Helper Functions
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleBookmark = (drugName, e) => {
    if(e) e.stopPropagation();
    setBookmarkedIds(prev => {
      const newBookmarks = prev.includes(drugName) 
        ? prev.filter(name => name !== drugName)
        : [...prev, drugName];
      localStorage.setItem('ayurveda-bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  // Resolves relative image paths to the raw GitHub URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `https://raw.githubusercontent.com/3ekodomo/dgdrugs/refs/heads/main/${imagePath}`;
  };

  // Robust TTS Function with hi-IN locale for Devanagari
  const speakText = (text, e) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }
    
    // Stop any currently playing audio immediately
    window.speechSynthesis.cancel(); 
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Essential for reading Devanagari scripts
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  const generateSpokenText = (drug) => {
    if (!drug) return "";
    let text = `${drug.name || ''}. `;
    if (drug.botanical) text += `Botanical name: ${drug.botanical}. `;
    if (drug.family) text += `Family: ${drug.family}. `;
    if (drug.indications) text += `Indications: ${drug.indications}. `;
    if (drug.info) text += `${drug.info}`;
    return text;
  };

  // Sort and Filter Logic
  const processedDrugs = useMemo(() => {
    let filtered = drugsData.filter(d => {
      const nameMatch = d.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const familyMatch = d.family?.toLowerCase().includes(searchQuery.toLowerCase());
      const botMatch = d.botanical?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || familyMatch || botMatch;
    });

    if (sortMode === 'name') {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortMode === 'family') {
      filtered.sort((a, b) => (a.family || "").localeCompare(b.family || "") || (a.name || "").localeCompare(b.name || ""));
    } else if (sortMode === 'bookmarks') {
      filtered = filtered.filter(d => bookmarkedIds.includes(d.name));
    }
    return filtered;
  }, [drugsData, searchQuery, sortMode, bookmarkedIds]);

  // Flashcard logic
  const handleNextCard = (e) => {
    if(e) e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex(Math.floor(Math.random() * drugsData.length));
    }, 150);
  };

  const currentFlashcard = drugsData[flashcardIndex];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md shadow-sm border-b ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold font-serif">
                A
             </div>
             <h1 className="text-xl font-bold tracking-tight">AyurBotanica</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-full transition-colors ${ttsEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={ttsEnabled ? "Disable Auto-TTS" : "Enable Auto-TTS on Tap"}
            >
              {ttsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-4 flex gap-6 border-t border-transparent">
            <button 
              onClick={() => setActiveTab('list')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'list' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              <List size={18} /> Drug List
            </button>
            <button 
              onClick={() => setActiveTab('flashcards')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'flashcards' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              <BookOpen size={18} /> Flashcards
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {loading && (
           <div className="flex justify-center items-center py-20 text-emerald-600">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
             <span className="ml-3 font-medium">Loading Data...</span>
           </div>
        )}

        {/* TAB 1: DRUG LIST */}
        {!loading && activeTab === 'list' && (
          <div className="space-y-6">
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, botanical, or family..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl self-start sm:self-auto overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
                <button 
                  onClick={() => setSortMode('name')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${sortMode === 'name' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  By Name
                </button>
                <button 
                  onClick={() => setSortMode('family')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${sortMode === 'family' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  By Family
                </button>
                <button 
                  onClick={() => setSortMode('bookmarks')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${sortMode === 'bookmarks' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  <Bookmark size={14} /> Saved
                </button>
              </div>
            </div>

            {/* List */}
            {processedDrugs.length === 0 ? (
               <div className="text-center py-12 text-slate-500">
                  No drugs found matching your criteria.
               </div>
            ) : (
              <div className="space-y-3">
                {processedDrugs.map((drug, index) => {
                  const isBookmarked = bookmarkedIds.includes(drug.name);
                  const isExpanded = expandedId === drug.name;
                  const imageUrl = getImageUrl(drug.image);

                  return (
                    <div 
                      key={index} 
                      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                    >
                      {/* Accordion Header - Always Visible */}
                      <div 
                        className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${isExpanded && theme === 'dark' ? 'bg-slate-700/30' : isExpanded ? 'bg-emerald-50' : ''}`}
                        onClick={() => {
                           setExpandedId(isExpanded ? null : drug.name);
                           if (!isExpanded && ttsEnabled) speakText(generateSpokenText(drug));
                        }}
                      >
                        <div className="flex-1 pr-4">
                          <h2 className="text-xl font-bold flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            {drug.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm italic text-slate-500 dark:text-slate-400">{drug.botanical}</span>
                            {drug.family && (
                               <span className="text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                 {drug.family}
                               </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => speakText(generateSpokenText(drug), e)}
                            className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition-colors hidden sm:block"
                            title="Listen"
                          >
                            <Volume2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => toggleBookmark(drug.name, e)}
                            className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            {isBookmarked ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}
                          </button>
                          <div className="text-slate-400 p-1">
                             {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Body - Collapsible Details */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 animation-slideDown bg-slate-50/50 dark:bg-slate-900/20">
                          
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Image Section */}
                            <div className="w-full md:w-1/3 shrink-0">
                              <div className={`aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={drug.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className={`flex-col items-center justify-center text-slate-400 p-4 text-center ${imageUrl ? 'hidden' : 'flex'}`}>
                                  <ImageIcon size={32} className="mb-2 opacity-50" />
                                  <span className="text-xs">No image available</span>
                                </div>
                              </div>
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-2/3 space-y-4 text-sm sm:text-base">
                              
                              {/* Properties Grid using Devanagari */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase mb-1">Rasa (रस)</span>
                                  <span className="font-serif">{drug.rasa || '-'}</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase mb-1">Guna (गुण)</span>
                                  <span className="font-serif">{drug.guna || '-'}</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase mb-1">Veerya (वीर्य)</span>
                                  <span className="font-serif">{drug.veerya || '-'}</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase mb-1">Vipaka (विपाक)</span>
                                  <span className="font-serif">{drug.vipaka || '-'}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {drug.parts && (
                                  <div>
                                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">Parts Used (प्रयोज्याङ्ग)</h4>
                                    <p className="font-serif">{drug.parts}</p>
                                  </div>
                                )}
                                {drug.dosha && (
                                  <div>
                                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">Dosha Karma (दोष)</h4>
                                    <p className="font-serif text-amber-600 dark:text-amber-400">{drug.dosha}</p>
                                  </div>
                                )}
                              </div>

                              {drug.agrya && (
                                <div>
                                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">Agrya (अग्र्य)</h4>
                                  <p className="font-serif text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-0.5 rounded">{drug.agrya}</p>
                                </div>
                              )}

                              {drug.karma && (
                                <div>
                                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Karma (कर्म)</h4>
                                  <p className="font-serif leading-relaxed text-slate-700 dark:text-slate-300">{drug.karma}</p>
                                </div>
                              )}

                              {drug.indications && (
                                <div>
                                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Indications (रोगघ्नता)</h4>
                                  <p className="font-serif leading-relaxed text-slate-700 dark:text-slate-300">{drug.indications}</p>
                                </div>
                              )}
                              
                              {drug.info && (
                                <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border-l-4 border-emerald-500 flex items-start gap-3">
                                  <Info size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">{drug.info}</p>
                                </div>
                              )}

                              {/* Mobile TTS Button */}
                              <div className="pt-2 sm:hidden">
                                <button 
                                  onClick={(e) => speakText(generateSpokenText(drug), e)}
                                  className="w-full py-2 flex justify-center items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium shadow-sm"
                                >
                                  <Volume2 size={18} /> Listen to Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FLASHCARDS */}
        {!loading && activeTab === 'flashcards' && currentFlashcard && (
          <div className="max-w-lg mx-auto w-full pt-8 pb-12 flex flex-col items-center">
            
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
              Tap the card to reveal details. Great for quick memorization.
            </p>

            {/* Flashcard Container */}
            <div 
              className={`w-full min-h-[460px] rounded-3xl p-8 cursor-pointer border-2 transition-all duration-500 flex flex-col justify-center relative shadow-xl hover:shadow-2xl ${
                isFlipped 
                  ? theme === 'dark' ? 'bg-slate-800 border-emerald-500/50' : 'bg-white border-emerald-400' 
                  : theme === 'dark' ? 'bg-gradient-to-br from-emerald-900/40 to-slate-800 border-slate-700' : 'bg-gradient-to-br from-emerald-50 to-white border-slate-200'
              }`}
              onClick={() => {
                const flipState = !isFlipped;
                setIsFlipped(flipState);
                if (flipState && ttsEnabled) {
                  speakText(generateSpokenText(currentFlashcard));
                }
              }}
            >
              {!isFlipped ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-slate-800 shadow-md">
                     <BookOpen className="text-emerald-500" size={36} />
                  </div>
                  <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{currentFlashcard?.name}</h2>
                  <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-12 animate-pulse">Tap to flip</p>
                </div>
              ) : (
                <div className="h-full flex flex-col animation-fadeIn">
                   <div className="border-b pb-4 mb-4 border-slate-100 dark:border-slate-700">
                     <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                            {currentFlashcard?.name}
                          </h2>
                          <p className="text-slate-500 dark:text-slate-400 italic">{currentFlashcard?.botanical}</p>
                        </div>
                        <button 
                          onClick={(e) => speakText(generateSpokenText(currentFlashcard), e)}
                          className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500"
                        >
                          <Volume2 size={20} />
                        </button>
                     </div>
                   </div>

                   <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar text-sm sm:text-base">
                      {currentFlashcard?.image && (
                        <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-4 bg-white dark:bg-slate-900">
                          <img src={getImageUrl(currentFlashcard.image)} alt={currentFlashcard.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {currentFlashcard?.family && (
                          <div>
                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Family</h4>
                            <p className="font-medium bg-slate-100 dark:bg-slate-700 inline-block px-2 py-0.5 rounded-lg text-sm">{currentFlashcard?.family}</p>
                          </div>
                        )}
                        
                        {currentFlashcard?.parts && (
                          <div>
                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Parts (अङ्ग)</h4>
                            <p className="font-serif">{currentFlashcard?.parts}</p>
                          </div>
                        )}
                      </div>

                      {currentFlashcard?.rasa && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Properties</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed">
                            <span className="text-emerald-600 dark:text-emerald-400">रस:</span> {currentFlashcard?.rasa} | 
                            <span className="text-emerald-600 dark:text-emerald-400 ml-2">गुण:</span> {currentFlashcard?.guna} <br/>
                            <span className="text-emerald-600 dark:text-emerald-400">वीर्य:</span> {currentFlashcard?.veerya} | 
                            <span className="text-emerald-600 dark:text-emerald-400 ml-2">विपाक:</span> {currentFlashcard?.vipaka}
                          </p>
                        </div>
                      )}

                      {currentFlashcard?.indications && (
                        <div>
                          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Indications (रोगघ्नता)</h4>
                          <p className="leading-relaxed font-serif">{currentFlashcard?.indications}</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* Flashcard Actions */}
            <div className="flex gap-4 mt-8 w-full">
              <button 
                onClick={(e) => toggleBookmark(currentFlashcard?.name, e)}
                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-medium transition-colors border ${bookmarkedIds.includes(currentFlashcard?.name) ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
              >
                {bookmarkedIds.includes(currentFlashcard?.name) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />} 
                {bookmarkedIds.includes(currentFlashcard?.name) ? 'Saved' : 'Save'}
              </button>
              
              <button 
                onClick={handleNextCard}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-emerald-500/30"
              >
                <Shuffle size={20} /> Next Card
              </button>
            </div>

          </div>
        )}
      </main>

      {/* Global Styles for Animations and Scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .animation-fadeIn {
          animation: fadeIn 0.4s ease-in-out forwards;
        }
        .animation-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: scaleY(0.95); }
          to { opacity: 1; transform: scaleY(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `}} />
    </div>
  );
}