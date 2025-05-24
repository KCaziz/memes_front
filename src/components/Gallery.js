import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './component.css';

const Gallery = () => {
    const [memes, setMemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMeme, setSelectedMeme] = useState(null);
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
        fetchMemes();
    }, []);

    const fetchMemes = async () => {
        try {
            const response = await axios.get('https://memes-back.onrender.com/api/memes');
            setMemes(response.data);
        } catch (error) {
            console.error('Erreur récupération memes:', error);
            toast.error('Erreur lors du chargement des memes');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMeme = async (memeId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce meme ?')) {
            return;
        }

        try {
            await axios.delete(`https://memes-back.onrender.com/api/memes/${memeId}`);
            setMemes(memes.filter(meme => meme._id !== memeId));
            toast.success('meme supprimé avec succès');
            setSelectedMeme(null);
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleShareMeme = async (meme) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `meme: ${meme.title}`,
                    text: `Regardez ce meme: ${meme.title}`,
                    url: meme.imageUrl,
                });
            } catch (error) {
                console.log('Partage annulé');
            }
        } else {
            navigator.clipboard.writeText(meme.imageUrl);
            toast.success('URL copiée dans le presse-papier!');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="gallery">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Chargement des memes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="gallery-page px-4 py-10 max-w-6xl mx-auto text-white">
            <h1 className="text-4xl font-bold text-center mb-2">Galerie de Memes</h1>
            <p className="text-center mb-10 text-white/80">
                {memes.length} meme{memes.length !== 1 ? 's' : ''} créé{memes.length !== 1 ? 's' : ''}
            </p>

            {memes.length === 0 ? (
                <div className="text-center mt-20">
                    <div className="text-6xl mb-4">🎭</div>
                    <h2 className="text-2xl font-semibold mb-2">Aucun meme pour le moment</h2>
                    <p className="mb-4">Commencez par créer votre premier meme !</p>
                    <a href="/" className="bg-white text-violet-600 px-5 py-2 rounded-full font-semibold hover:bg-violet-100 transition">
                        Créer un meme
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memes.map((meme) => (
                        <div
                            key={meme._id}
                            className="bg-white/10 backdrop-blur rounded-xl overflow-hidden shadow-md cursor-pointer hover:scale-105 transition duration-300"
                            onClick={() => setSelectedMeme(meme)}
                        >
                            <div className="relative aspect-square">
                                <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-cover" />
                                {meme.topText && (
                                    <div className="meme-text meme-text-top">{meme.topText}</div>
                                )}
                                {meme.bottomText && (
                                    <div className="meme-text meme-text-bottom">{meme.bottomText}</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg">{meme.title}</h3>
                                <p className="text-sm text-white/60">{formatDate(meme.createdAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedMeme && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 " onClick={() => setSelectedMeme(null)}>
                    <div className="bg-white text-black max-w-3xl  rounded-2xl shadow-xl sm:max-h-[30rem] mx-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                            <h2 className="text-xl font-bold">{selectedMeme.title}</h2>
                            <button onClick={() => setSelectedMeme(null)} className="text-2xl text-gray-600 hover:text-red-500 transition">×</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 p-6">
                            <div className="relative w-full">
                                <img src={selectedMeme.imageUrl} alt={selectedMeme.title} className="w-full rounded-lg transition-transform hover:scale-105" onClick={() => setShowFullImage(true)}
                                />
                            </div>
                            {showFullImage && (
                                <div
                                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 mt-20"
                                    onClick={() => setShowFullImage(false)} // ferme au clic
                                >
                                    <img
                                        src={selectedMeme.imageUrl}
                                        alt={selectedMeme.title}
                                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                                    />
                                </div>
                            )}
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">Créé le {formatDate(selectedMeme.createdAt)}</p>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => handleShareMeme(selectedMeme)} className="modal-btn share-btn w-full mx-10">Partager</button>
                                    <a href={selectedMeme.imageUrl} download={`${selectedMeme.title}.jpg`} className="modal-btn download-btn w-full mx-10">Télécharger</a>
                                    <button onClick={() => handleDeleteMeme(selectedMeme._id)} className="modal-btn delete-btn w-full mx-10">Supprimer</button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default Gallery;