import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Clock, Users, ChevronRight, X, Trash2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchFavorites(page);
    }, [page]);

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

    const fetchFavorites = async (pageNum) => {
        setLoading(true);
        try {
            const limit = 12;
            const skip = pageNum * limit;
            const res = await api.get(`/favorites?skip=${skip}&limit=${limit}`);

            if (res.data.length < limit) {
                setHasMore(false);
            }

            setFavorites(prev => {
                // If page 0, replace. Else append. 
                // However, React Strict Mode might call this twice. 
                // A simple safeguard is to check if items already exist from this batch, or just rely on backend order.
                if (pageNum === 0) return res.data;
                // Avoid duplicates if any (simple check)
                const newIds = new Set(res.data.map(i => i.id));
                return [...prev, ...res.data.filter(i => !prev.some(p => p.id === i.id))];
            });
        } catch (e) { }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this recipe from your cookbook?")) return;
        try {
            await api.delete(`/favorites/id/${id}`);
            setFavorites(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const handleDownload = async (recipe, elementId) => {
        // Since we are in a modal, standard element lookup might be tricky if not careful with IDs.
        // We will assign a unique ID to the modal content wrapper.
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                ignoreElements: (element) => element.classList.contains('ignore-pdf')
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${recipe.name}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Download failed.");
        }
    };

    return (
        <div className="container">
            <div style={{ width: '100%' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Your Cookbook</h1>
                <p style={{ color: '#888', marginBottom: '30px' }}>Collection of your favorite AI-generated recipes.</p>

                {favorites.length === 0 ? (
                    <div className="empty-state">
                        <h3>No Favorites Yet</h3>
                        <p>Save recipes from your AI Chef analyses to see them here.</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {favorites.map((fav) => (
                            <div
                                key={fav.id}
                                className="recipe-card-hover"
                                onClick={() => setSelectedRecipe(fav.recipe_data)}
                            >
                                <div style={{ height: 180, overflow: 'hidden', backgroundColor: '#333', position: 'relative' }}>
                                    <img
                                        src={fav.recipe_data.image_path ? `http://localhost:8000/${fav.recipe_data.image_path}` : `https://image.pollinations.ai/prompt/${encodeURIComponent(fav.recipe_data.english_name || fav.recipe_data.name)} delicious food photorealistic?width=400&height=250&nologo=true`}
                                        alt={fav.recipe_data.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                        onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                    <div className="card-overlay">
                                        <span>View Recipe</span>
                                    </div>
                                </div>

                                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: 'calc(100% - 180px)' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.recipe_data.name}</h3>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.85rem', color: '#888', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {fav.recipe_data.ingredients.join(', ')}
                                        </p>
                                    </div>
                                    <div style={{ borderTop: '1px solid #3e3e42', paddingTop: 15, marginTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#888', fontSize: '0.8rem' }}>
                                            <Clock size={14} /> <span>30m</span>
                                            <Users size={14} style={{ marginLeft: 8 }} /> <span>2</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(fav.id);
                                            }}
                                            className="btn-text"
                                            style={{ color: '#ff4d4d', padding: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer' }}
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedRecipe && (
                <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
                    <div id="favorite-modal-content" className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                        <div style={{ position: 'relative' }}>
                            <button className="close-btn ignore-pdf" onClick={() => setSelectedRecipe(null)} style={{ zIndex: 20 }}>
                                <X size={24} />
                            </button>

                            <button
                                className="ignore-pdf"
                                onClick={() => handleDownload(selectedRecipe, 'favorite-modal-content')}
                                style={{
                                    position: 'absolute',
                                    top: 15,
                                    right: 60,
                                    zIndex: 20,
                                    background: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 40,
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#007acc'
                                }}
                                title="Download PDF"
                            >
                                <Download size={20} />
                            </button>

                            <div className="modal-header-image">
                                <img
                                    src={selectedRecipe.image_path ? `http://localhost:8000/${selectedRecipe.image_path}` : `https://image.pollinations.ai/prompt/${encodeURIComponent(selectedRecipe.english_name || selectedRecipe.name)} delicious food photorealistic?width=800&height=400&nologo=true`}
                                    alt={selectedRecipe.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    crossOrigin="anonymous"
                                />
                                <div className="modal-title-overlay">
                                    <h2>{selectedRecipe.name}</h2>
                                </div>
                            </div>

                            <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div>
                                    <h4 style={{ color: '#007acc', borderBottom: '2px solid #333', paddingBottom: 10, marginTop: 0 }}>Ingredients</h4>
                                    <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: '#ddd' }}>
                                        {selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                    </ul>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <h4 style={{ color: '#007acc', borderBottom: '2px solid #333', paddingBottom: 10 }}>Instructions</h4>
                                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#ddd', fontSize: '1.05rem' }}>
                                        {selectedRecipe.instructions}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Favorites;
