import React, { useState } from 'react';
import { Upload, FileText, Heart, Download } from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';

const AiChef = () => {
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
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
            await api.post('/favorites', { recipe_data: recipe });
            alert('Added to favorites');
        } catch (e) { alert('Error adding favorite'); }
    };

    const handleDownload = (recipe) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(recipe.name, 10, 10);
        doc.setFontSize(12);
        doc.text("Ingredients:", 10, 20);
        recipe.ingredients.forEach((ing, i) => {
            doc.text(`- ${ing}`, 10, 30 + (i * 5));
        });
        const startInst = 30 + (recipe.ingredients.length * 5) + 10;
        doc.text("Instructions:", 10, startInst);

        const splitText = doc.splitTextToSize(recipe.instructions, 180);
        doc.text(splitText, 10, startInst + 10);

        doc.save(`${recipe.name}.pdf`);
    };

    return (
        <div className="container">
            <div style={{ width: '100%' }}>
                <h1>AI Chef</h1>
                <div
                    className="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <input
                        id="fileInput"
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    {file ? (
                        <p>{file.name}</p>
                    ) : (
                        <div>
                            <Upload size={40} />
                            <p>Click or Drag and Drop Fridge Photo Here</p>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Additional Instructions (Prompt)</label>
                    <textarea
                        rows="3"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., I want something spicy, or low carb."
                    />
                </div>

                <button
                    className="btn"
                    onClick={handleAnalyze}
                    disabled={loading || !file}
                >
                    {loading ? 'Analyzing...' : 'Analyze Fridge'}
                </button>

                <div style={{ marginTop: 40 }}>
                    {result && Array.isArray(result) && result.map((recipe, idx) => (
                        <div key={idx} className="recipe-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3>{recipe.name}</h3>
                                <div>
                                    <button className="btn btn-secondary" onClick={() => handleFavorite(recipe)} style={{ marginRight: 10 }}>
                                        <Heart size={16} />
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => handleDownload(recipe)}>
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                            <h4>Ingredients</h4>
                            <ul>
                                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                            <h4>Instructions</h4>
                            <p style={{ whiteSpace: 'pre-line' }}>{recipe.instructions}</p>
                        </div>
                    ))}
                    {result && result.error && <p style={{ color: 'red' }}>{result.error}</p>}
                </div>
            </div>
        </div>
    );
};

export default AiChef;
