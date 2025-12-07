import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const MyHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/history');
                setHistory(res.data);
            } catch (e) { }
        };
        fetchHistory();
    }, []);

    return (
        <div className="container">
            <div style={{ width: '100%' }}>
                <h1>My Cooking History</h1>
                {history.map((h) => (
                    <div key={h.id} className="recipe-card">
                        <div style={{ display: 'flex', gap: 20 }}>
                            {h.input_image_path && (
                                <img
                                    src={`http://localhost:8000/${h.input_image_path.replace('backend/', '')}`}
                                    alt="Input"
                                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <p><strong>Prompt:</strong> {h.prompt_text || "No prompt"}</p>
                                <div>
                                    {h.analysis_result && Array.isArray(h.analysis_result) && (
                                        <ul>
                                            {h.analysis_result.map((r, i) => (
                                                <li key={i}>{r.name}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyHistory;
