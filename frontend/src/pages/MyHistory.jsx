import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Calendar, ChevronRight, X, Trash2, Download, Heart } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MyHistory = () => {
    const [history, setHistory] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [selectedItem, setSelectedItem] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchHistory(page);
    }, [page]);

    useEffect(() => {
        fetchFavorites();
    }, []);

    useEffect(() => {
        const container = document.querySelector('.main-content');
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
                if (hasMore && !loading) {
                    setPage(prev => prev + 1);
                }
            }
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading]);

    const fetchHistory = async (pageNum) => {
        setLoading(true);
        try {
            const limit = 5;
            const skip = pageNum * limit;
            const res = await api.get(`/history?skip=${skip}&limit=${limit}`);
            if (res.data.length < limit) setHasMore(false);

            setHistory(prev => {
                if (pageNum === 0) return res.data;
                return [...prev, ...res.data.filter(i => !prev.some(p => p.id === i.id))];
            });
        } catch (e) { }
        setLoading(false);
    };

    const fetchFavorites = async () => {
        try {
            const res = await api.get('/favorites?limit=1000');
            setFavorites(new Set(res.data.map(f => f.recipe_data?.name || f.recipe_name)));
        } catch (e) { }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this history item?")) return;
        try {
            await api.delete(`/history/${id}`);
            setHistory(prev => prev.filter(h => h.id !== id));
            if (selectedItem && selectedItem.id === id) setSelectedItem(null);
        } catch (e) {
            alert('Failed to delete');
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

    const handleDownload = async (recipe, elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${recipe.name}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Download failed. Ensuring images are loaded.");
        }
    };

    return (
        <div className="container">
            <div style={{ width: '100%' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Cooking History</h1>
                <p style={{ color: '#888', marginBottom: '30px' }}>Review your past ingredient scans and generated recipes.</p>

                {history.length === 0 ? (
                    <div className="empty-state">
                        <h3>No History Found</h3>
                        <p>Your past AI cooking adventures will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                        {history.map((h) => {
                            // Extract first image for preview
                            const images = h.input_image_path ? h.input_image_path.split(',') : [];
                            const firstImage = images.length > 0 ? images[0] : null;

                            return (
                                <div
                                    key={h.id}
                                    className="history-card"
                                    onClick={() => setSelectedItem(h)}
                                    style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
                                >
                                    <div className="history-image" style={{ width: '100%', height: 200, position: 'relative' }}>
                                        {firstImage ? (
                                            <img
                                                src={`http://localhost:8000/${firstImage.replace('backend/', '')}`}
                                                alt="Input"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>No Image</div>
                                        )}
                                        {images.length > 1 && (
                                            <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                                                +{images.length - 1} more
                                            </div>
                                        )}
                                    </div>
                                    <div className="history-content" style={{ flex: 1, padding: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#888', marginBottom: 8 }}>
                                            <Calendar size={14} />
                                            <span>Analysis #{h.id}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: '#fff' }}>
                                            {h.prompt_text ? `"${h.prompt_text}"` : "Fridge Analysis"}
                                        </h3>

                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>
                                            {h.analysis_result && (h.analysis_result.recipes || h.analysis_result || []).slice(0, 3).map((r, i) => (
                                                <span key={i} style={{ background: '#252526', border: '1px solid #3e3e42', padding: '4px 10px', borderRadius: 6, fontSize: '0.85rem', color: '#ccc' }}>
                                                    {r.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Footer Actions */}
                                        <div style={{ borderTop: '1px solid #3e3e42', paddingTop: 15, marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 10 }} onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => handleDelete(e, h.id)}
                                                className="btn-secondary"
                                                style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d', borderColor: '#ff4d4d30', width: 32, height: 32 }}
                                                title="Delete History"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedItem(h)}
                                                className="btn-secondary"
                                                style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, color: '#007acc', borderColor: '#007acc30' }}
                                            >
                                                View Details <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {
                    selectedItem && (
                        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '20px 30px', borderBottom: '1px solid #3e3e42', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0 }}>Analysis Details</h2>
                                    <button className="close-btn" onClick={() => setSelectedItem(null)} style={{ position: 'static' }}>
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ padding: '30px', overflowY: 'auto' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginBottom: 40 }}>
                                        {/* Input Images Section */}
                                        <div style={{ width: '100%' }}>
                                            <h4 style={{ color: '#888', marginBottom: 10 }}>Input Images</h4>
                                            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                                                {selectedItem.input_image_path ? (
                                                    selectedItem.input_image_path.split(',').map((path, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={`http://localhost:8000/${path.replace('backend/', '')}`}
                                                            alt={`Input ${idx + 1}`}
                                                            style={{ height: 200, width: 'auto', borderRadius: 8, border: '1px solid #444', flexShrink: 0, cursor: 'zoom-in' }}
                                                            onClick={() => setPreviewImage(`http://localhost:8000/${path.replace('backend/', '')}`)}
                                                            title="Click to enlarge"
                                                        />
                                                    ))
                                                ) : (
                                                    <div style={{ padding: 20, textAlign: 'center', background: '#333', borderRadius: 8, color: '#aaa', width: '100%' }}>No Images</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Request Details Section */}
                                        <div style={{ width: '100%' }}>
                                            <h4 style={{ color: '#888', marginBottom: 10 }}>Your Request</h4>
                                            <div style={{ background: '#252526', padding: 15, borderRadius: 8, color: '#e0e0e0', fontStyle: 'italic', marginBottom: 20 }}>
                                                "{selectedItem.prompt_text || "No specific instructions provided."}"
                                            </div>

                                            {selectedItem.analysis_result?.detected_ingredients && (
                                                <div>
                                                    <h4 style={{ color: '#888', marginBottom: 10 }}>Detected Ingredients</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        {selectedItem.analysis_result.detected_ingredients.map((ing, i) => (
                                                            <span key={i} style={{ background: '#007acc20', color: '#4daafc', padding: '4px 10px', borderRadius: 15, fontSize: '0.9rem' }}>{ing}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 style={{ borderLeft: '4px solid #007acc', paddingLeft: 10, marginBottom: 20 }}>Generated Recipes</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                                        {(selectedItem.analysis_result?.recipes || selectedItem.analysis_result || []).map((recipe, idx) => (
                                            <div key={idx} className="recipe-card" id={`history-recipe-${idx}`} style={{ margin: 0, background: '#252526', borderRadius: 10, border: '1px solid #3e3e42', position: 'relative' }}>
                                                {/* Recipe Image Display inside details */}
                                                <div style={{ width: '100%', height: 200, overflow: 'hidden', borderRadius: '8px 8px 0 0', marginBottom: 15, backgroundColor: '#333' }}>
                                                    <img
                                                        src={recipe.image_path ? `http://localhost:8000/${recipe.image_path}` : `https://tse2.mm.bing.net/th?q=${encodeURIComponent((recipe.english_name || recipe.name) + " delicious food photorealistic")}&w=800&h=500&c=7&rs=1&p=0`}
                                                        alt={recipe.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        crossOrigin="anonymous"
                                                    />
                                                </div>

                                                <div style={{ padding: '0 20px 20px 20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                                        <h4 style={{ fontSize: '1.2rem', marginTop: 0, color: '#fff', marginBottom: 0 }}>{recipe.name}</h4>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            <button
                                                                className={`btn ${favorites.has(recipe.name) ? '' : 'btn-secondary'}`}
                                                                onClick={() => handleFavorite(recipe)}
                                                                title={favorites.has(recipe.name) ? "Saved" : "Add to Favorites"}
                                                                style={{ padding: 6, ...favorites.has(recipe.name) ? { backgroundColor: '#e91e63' } : {} }}
                                                            >
                                                                <Heart size={18} fill={favorites.has(recipe.name) ? 'white' : 'none'} />
                                                            </button>
                                                            <button
                                                                className="btn-download"
                                                                onClick={() => handleDownload(recipe, `history-recipe-${idx}`)}
                                                                title="Download PDF"
                                                                data-html2canvas-ignore="true"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                                            >
                                                                <Download size={20} color="#007acc" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div style={{ margin: '15px 0' }}>
                                                        <strong style={{ color: '#aaa', fontSize: '0.9rem' }}>Ingredients:</strong>
                                                        <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: 5 }}>{recipe.ingredients.join(', ')}</p>
                                                    </div>
                                                    <div>
                                                        <strong style={{ color: '#aaa', fontSize: '0.9rem' }}>Instructions:</strong>
                                                        <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: 5, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{recipe.instructions}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Full Image Preview Modal */}
                {previewImage && (
                    <div className="modal-overlay" onClick={() => setPreviewImage(null)} style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
                        <div style={{ position: 'relative', width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button
                                className="close-btn"
                                onClick={() => setPreviewImage(null)}
                                style={{ position: 'absolute', top: -20, right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <X size={32} />
                            </button>
                            <img
                                src={previewImage}
                                alt="Full Preview"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
};

export default MyHistory;
