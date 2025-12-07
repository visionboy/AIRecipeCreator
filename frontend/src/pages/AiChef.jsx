import React, { useState, useRef, useEffect } from 'react';
import { Upload, Heart, Download, X, Maximize2, Paperclip, Mic, Loader2 } from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AiChef = () => {
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [imageModal, setImageModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Cleanup object URLs to avoid memory leaks
        return () => {
            filePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [filePreviews]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
        // Reset input value to allow selecting same file again if needed
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const addFiles = (newFiles) => {
        const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
        if (files.length + validFiles.length > 3) {
            alert("You can upload a maximum of 3 images.");
            return;
        }

        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);

        // Generate previews
        const newPreviews = validFiles.map(f => URL.createObjectURL(f));
        setFilePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        const newPreviews = [...filePreviews];

        URL.revokeObjectURL(newPreviews[index]); // Cleanup

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setFiles(newFiles);
        setFilePreviews(newPreviews);
    };

    const handleMicClick = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setPrompt(prev => prev ? prev + ' ' + transcript : transcript);
        };

        recognition.start();
    };

    const handleAnalyze = async () => {
        if (files.length === 0) {
            alert('Please upload at least one image.');
            return;
        }
        setLoading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('prompt', prompt);

        try {
            const res = await api.post('/analyze', formData);
            setResult(res.data);
        } catch (error) {
            alert('Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFavorite = async (recipe) => {
        try {
            if (favorites.has(recipe.name)) {
                await api.delete(`/favorites/${encodeURIComponent(recipe.name)}`);
                setFavorites(prev => {
                    const next = new Set(prev);
                    next.delete(recipe.name);
                    return next;
                });
            } else {
                await api.post('/favorites', { recipe_data: recipe });
                setFavorites(prev => new Set(prev).add(recipe.name));
            }
        } catch (e) { alert('Error updating favorite'); }
    };

    const ImageWithLoader = ({ src, alt, ...props }) => {
        const [loaded, setLoaded] = useState(false);
        const [error, setError] = useState(false);

        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#333' }}>
                {!loaded && !error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#aaa' }}>
                        <Loader2 className="spin-animation" style={{ width: 40, height: 40, color: '#007acc' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Generating Image...</span>
                    </div>
                )}
                {error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', flexDirection: 'column', padding: 10, textAlign: 'center' }}>
                        <span style={{ fontSize: '2rem', marginBottom: 5 }}>🍳</span>
                        <span style={{ fontSize: '0.8rem' }}>Image not available</span>
                    </div>
                )}
                <img
                    src={src}
                    alt={alt}
                    {...props}
                    style={{ ...props.style, opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            </div>
        );
    };

    const handleDownload = async (recipe, elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${recipe.name}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Download failed");
        }
    };

    return (
        <div className="container" style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: '30px', overflow: 'hidden' }}>

            {/* Left Column: Input Area */}
            <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <div>
                    <h1>AI Chef</h1>
                    <p style={{ color: '#858585', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: 20 }}>
                        Hello! I'm your personal AI Chef.<br />
                        Upload up to photos of your fridge or ingredients, and I'll suggest delicious recipes for you.
                    </p>
                </div>

                {/* Chat Input Container */}
                <div
                    style={{ background: '#252526', borderRadius: 16, padding: 15, border: '1px solid #3e3e42', position: 'relative', display: 'flex', flexDirection: 'column', gap: 15 }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleDrop}
                >
                    <textarea
                        rows={1}
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                        }}
                        placeholder="Message AI Chef..."
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            minHeight: 24,
                            maxHeight: 150,
                            overflowY: 'auto'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAnalyze();
                            }
                        }}
                    />

                    {files.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {filePreviews.map((url, i) => (
                                <div key={i} style={{ position: 'relative', width: 60, height: 60 }}>
                                    <img
                                        src={url}
                                        alt={`Upload ${i}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid #555' }}
                                        onClick={() => { setPreviewImage(url); setImageModal(true); }}
                                    />
                                    <button
                                        onClick={() => removeFile(i)}
                                        style={{ position: 'absolute', top: -6, right: -6, background: '#333', borderRadius: '50%', border: '1px solid #555', color: '#fff', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            style={{ padding: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#ccc', cursor: 'pointer', borderRadius: '50%', transition: 'background 0.2s', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Attach Images"
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <Paperclip size={18} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleFileChange}
                            accept="image/*"
                        />

                        <button
                            onClick={handleMicClick}
                            style={{
                                padding: 8,
                                background: isListening ? '#e91e63' : 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: isListening ? 'white' : '#ccc',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                transition: 'all 0.2s',
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Voice Input"
                            onMouseOver={(e) => !isListening && (e.target.style.background = 'rgba(255,255,255,0.1)')}
                            onMouseOut={(e) => !isListening && (e.target.style.background = 'rgba(255,255,255,0.05)')}
                        >
                            <Mic size={18} />
                        </button>
                    </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 10, textAlign: 'center' }}>
                    Tip: You can drag & drop images directly here.
                </p>
            </div>

            {/* Right Column: Results Area */}
            <div style={{ flex: 1, backgroundColor: '#252526', borderRadius: 12, border: '1px solid #3e3e42', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {loading && (
                        <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: 'none', background: 'none', padding: 20 }}>
                            <div className="loader"></div>
                            <h3 className="pulse-animation" style={{ color: '#007acc' }}>Cooking up some magic...</h3>
                        </div>
                    )}

                    {!loading && !result && (
                        <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: 'none', background: 'none', padding: 20 }}>
                            <h3>No Recipes Yet</h3>
                            <p>Upload photos and ask AI Chef to get started!</p>
                        </div>
                    )}

                    {result && result.error && (
                        <div className="empty-state" style={{ borderColor: '#f85149', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 }}>
                            <h3 style={{ color: '#f85149' }}>Error</h3>
                            <p>{result.error}</p>
                        </div>
                    )}

                    {result && (result.recipes || Array.isArray(result)) && (
                        <div style={{ animation: 'fadeIn 0.5s ease-out', padding: 20 }}>
                            {result.detected_ingredients && (
                                <div style={{ marginBottom: 30, padding: 20, background: '#1e1e1e', borderRadius: 10, border: '1px solid #3e3e42' }}>
                                    <h3 style={{ marginBottom: 15, color: '#e0e0e0' }}>📸 Detected Ingredients</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {result.detected_ingredients.map((ing, i) => (
                                            <span key={i} style={{ background: '#007acc', color: 'white', padding: '5px 12px', borderRadius: 20, fontSize: '0.95rem' }}>
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h2 style={{ marginBottom: 20 }}>Suggested Recipes</h2>
                            {(result.recipes || result).map((recipe, idx) => (
                                <div key={idx} className="recipe-card" id={`recipe-card-${idx}`} style={{ border: '1px solid #3e3e42', background: '#1e1e1e' }}>
                                    {/* Recipe Image Display */}
                                    <div style={{ width: '100%', height: 250, overflow: 'hidden', borderRadius: '8px 8px 0 0', marginBottom: 15, backgroundColor: '#333' }}>
                                        <ImageWithLoader
                                            src={recipe.image_path ? `http://localhost:8000/${recipe.image_path}` : `https://tse2.mm.bing.net/th?q=${encodeURIComponent((recipe.english_name || recipe.name) + " delicious food photorealistic")}&w=800&h=500&c=7&rs=1&p=0`}
                                            alt={recipe.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            crossOrigin="anonymous"
                                        />
                                    </div>

                                    <div style={{ padding: '0 10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                                            <h3 style={{ fontSize: '1.4rem', marginBottom: 0 }}>{recipe.name}</h3>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button
                                                    className={`btn ${favorites.has(recipe.name) ? '' : 'btn-secondary'}`}
                                                    onClick={() => handleFavorite(recipe)}
                                                    title={favorites.has(recipe.name) ? "Saved" : "Add to Favorites"}
                                                    style={favorites.has(recipe.name) ? { backgroundColor: '#e91e63' } : {}}
                                                >
                                                    <Heart size={18} fill={favorites.has(recipe.name) ? 'white' : 'none'} />
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => handleDownload(recipe, `recipe-card-${idx}`)} title="Download PDF">
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: 20 }}>
                                            <h4 style={{ color: '#cccccc', borderBottom: '1px solid #3e3e42', paddingBottom: 8, marginBottom: 10 }}>Ingredients</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {recipe.ingredients.map((ing, i) => (
                                                    <span key={i} style={{ background: '#333', padding: '4px 10px', borderRadius: 15, fontSize: '0.9rem' }}>{ing}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ color: '#cccccc', borderBottom: '1px solid #3e3e42', paddingBottom: 8, marginBottom: 10 }}>Instructions</h4>
                                            <p className="recipe-instructions" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{recipe.instructions}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {imageModal && previewImage && (
                <div className="modal-overlay" onClick={() => setImageModal(false)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                        <button
                            onClick={() => setImageModal(false)}
                            style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <X size={32} />
                        </button>
                        <img src={previewImage} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiChef;
