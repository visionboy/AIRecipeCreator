import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await api.get('/favorites');
                setFavorites(res.data);
            } catch (e) { }
        };
        fetchFavorites();
    }, []);

    return (
        <div className="container">
            <div style={{ width: '100%' }}>
                <h1>Favorites</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                    {favorites.map((fav) => (
                        <div
                            key={fav.id}
                            className="recipe-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedRecipe(fav.recipe_data)}
                        >
                            <h3>{fav.recipe_data.name}</h3>
                            <p>{fav.recipe_data.ingredients.length} Ingredients</p>
                        </div>
                    ))}
                </div>

                {selectedRecipe && (
                    <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>{selectedRecipe.name}</h2>
                            <h4>Ingredients</h4>
                            <ul>
                                {selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                            <h4>Instructions</h4>
                            <p style={{ whiteSpace: 'pre-line' }}>{selectedRecipe.instructions}</p>
                            <button className="btn" onClick={() => setSelectedRecipe(null)} style={{ marginTop: 20 }}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
