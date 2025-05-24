import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import './component.css';
import InteractifGen from './InteractifGen';

const MemeGenerator = () => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [cloudinaryId, setCloudinaryId] = useState('');
    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [title, setTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [preview, setPreview] = useState(null);
    const [displayMode, setDisplayMode] = useState('single');
    const [customTexts, setCustomTexts] = useState([]);
    const [textEditMode, setTextEditMode] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [textColor, setTextColor] = useState('#ffffff');
    const [textBgColor, setTextBgColor] = useState('#000000');
    const [textBgOpacity, setTextBgOpacity] = useState(0.7);
    const [editingText, setEditingText] = useState('');
    const [showCustomEditor, setShowCustomEditor] = useState(false);

    const memeRef = useRef(null);
    const canvasRef = useRef(null);

    function hexToRgba(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }


    const displayModes = {
        single: { name: 'Image unique', maxImages: 1 },
        horizontal: { name: 'Horizontal (2)', maxImages: 2 },
        vertical: { name: 'Vertical (2)', maxImages: 2 },
        grid2x2: { name: 'Grille 2x2', maxImages: 4 }
    };

    const handleImageUpload = async (event) => {
        const files = Array.from(event.target.files);
        const maxImages = displayModes[displayMode].maxImages;

        if (selectedImages.length + files.length > maxImages) {
            toast.error(`Maximum ${maxImages} image(s) pour ce mode d'affichage`);
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} est trop volumineux (max 5MB)`);
                return false;
            }
            return true;
        });

        const newImages = validFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Date.now() + Math.random()
        }));

        setSelectedImages(prev => [...prev, ...newImages]);
        if (validFiles.length > 0) {
            setIsUploading(true);
            setTimeout(() => setIsUploading(false), 1000);
        }
    };

    const removeImage = (imageId) => {
        setSelectedImages(prev => {
            const updated = prev.filter(img => img.id !== imageId);
            // Libérer l'URL de l'image supprimée
            const removedImage = prev.find(img => img.id === imageId);
            if (removedImage) {
                URL.revokeObjectURL(removedImage.preview);
            }
            return updated;
        });

        // Nettoyer les textes personnalisés associés à cette image
        setCustomTexts(prev => prev.filter(text => text.imageIndex !== imageId));
    };

    const handleCanvasClick = (event) => {
        if (!textEditMode || selectedImages.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const img = event.target;
        const rect = img.getBoundingClientRect();

        const x = ((event.clientX - rect.left) / rect.width) * img.naturalWidth;
        const y = ((event.clientY - rect.top) / rect.height) * img.naturalHeight;

        const newText = {
            id: Date.now(),
            text: 'Nouveau texte',
            x: x,
            y: y,
            imageIndex: activeImageIndex,
            color: textColor,
            bgColor: textBgColor,
            bgOpacity: textBgOpacity,
            isEditing: true
        };

        setCustomTexts(prev => [...prev, newText]);
    };

    const updateCustomText = (textId, newText) => {
        setCustomTexts(prev => prev.map(t =>
            t.id === textId ? { ...t, text: newText, isEditing: false } : t
        ));
    };

    const removeCustomText = (textId) => {
        setCustomTexts(prev => prev.filter(t => t.id !== textId));
    };

    const generateMemeImage = async () => {
        if (selectedImages.length === 0) return null;

        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Dimensions du canvas selon le mode d'affichage
            let canvasWidth = 800;
            let canvasHeight = 600;

            if (displayMode === 'horizontal') {
                canvasWidth = 1200;
                canvasHeight = 600;
            } else if (displayMode === 'vertical') {
                canvasWidth = 600;
                canvasHeight = 1200;
            } else if (displayMode === 'grid2x2') {
                canvasWidth = 1000;
                canvasHeight = 1000;
            }

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            let imagesLoaded = 0;
            const totalImages = selectedImages.length;

            const drawTextsOnCanvas = () => {
                // Texte du haut (global)
                if (topText) {
                    const topFontSize = Math.floor(canvasWidth / 15);
                    const topTextY = 20;

                    ctx.font = `bold ${topFontSize}px Impact`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";

                    const textMetrics = ctx.measureText(topText); // CORRIGÉ
                    const textWidth = textMetrics.width;
                    const textHeight = topFontSize;

                    if (textBgOpacity > 0) {
                        const padding = 10;
                        const rectX = canvasWidth / 2 - textWidth / 2 - padding;
                        const rectY = topTextY - padding / 2;
                        const rectWidth = textWidth + padding * 2;
                        const rectHeight = textHeight + padding;

                        ctx.fillStyle = hexToRgba(textBgColor, textBgOpacity); // CORRIGÉ
                        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                    }

                    ctx.fillStyle = textColor;
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 3;
                    ctx.strokeText(topText, canvasWidth / 2, topTextY);
                    ctx.fillText(topText, canvasWidth / 2, topTextY);
                }



                if (bottomText) {
                    const bottomFontSize = Math.floor(canvasWidth / 15);
                    const bottomTextY = canvasHeight - 60;

                    ctx.font = `bold ${bottomFontSize}px Impact`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";

                    const textMetrics = ctx.measureText(bottomText);
                    const textWidth = textMetrics.width;
                    const textHeight = bottomFontSize;

                    if (textBgOpacity > 0) {
                        const padding = 10;
                        const rectX = canvasWidth / 2 - textWidth / 2 - padding;
                        const rectY = bottomTextY - textHeight - padding / 2;
                        const rectWidth = textWidth + padding * 2;
                        const rectHeight = textHeight + padding;

                        ctx.fillStyle = hexToRgba(textBgColor, textBgOpacity); // CORRIGÉ
                        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                    }

                    ctx.fillStyle = textColor;
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 3;
                    ctx.strokeText(bottomText, canvasWidth / 2, bottomTextY);
                    ctx.fillText(bottomText, canvasWidth / 2, bottomTextY);
                }


                customTexts.forEach(textObj => {
                    if (textObj.text && !textObj.isEditing) {
                        const fontSize = Math.floor(canvasWidth / 20);
                        ctx.font = `bold ${fontSize}px Impact`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        // Fond du texte si nécessaire
                        if (textObj.bgOpacity > 0) {
                            const textWidth = ctx.measureText(textObj.text).width;
                            const padding = 10;

                            ctx.fillStyle = `${textObj.bgColor}${Math.floor(textObj.bgOpacity * 255).toString(16).padStart(2, '0')}`;
                            ctx.fillRect(
                                textObj.x - textWidth / 2 - padding,
                                textObj.y - fontSize / 2 - padding / 2,
                                textWidth + padding * 2,
                                fontSize + padding
                            );
                        }

                        // Texte
                        ctx.fillStyle = textObj.color;
                        ctx.strokeStyle = "#000000";
                        ctx.lineWidth = 2;

                        ctx.strokeText(textObj.text, textObj.x, textObj.y);
                        ctx.fillText(textObj.text, textObj.x, textObj.y);
                    }
                });
            };

            const onImageLoad = () => {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    drawTextsOnCanvas();
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            setPreview(url);
                            resolve(blob);
                        } else {
                            reject(new Error("Échec génération meme"));
                        }
                    }, "image/png");
                }
            };

            // Dessiner les images selon le mode d'affichage
            selectedImages.forEach((imageData, index) => {
                const img = new Image();
                img.onload = () => {
                    let x = 0, y = 0, width = canvasWidth, height = canvasHeight;

                    if (displayMode === 'horizontal' && selectedImages.length === 2) {
                        width = canvasWidth / 2;
                        x = index * width;
                    } else if (displayMode === 'vertical' && selectedImages.length === 2) {
                        height = canvasHeight / 2;
                        y = index * height;
                    } else if (displayMode === 'grid2x2') {
                        width = canvasWidth / 2;
                        height = canvasHeight / 2;
                        x = (index % 2) * width;
                        y = Math.floor(index / 2) * height;
                    }

                    // Remplir la zone avec un fond blanc
                    ctx.fillStyle = "white";
                    ctx.fillRect(x, y, width, height);

                    // Maintenir le ratio d'aspect et centrer
                    const aspectRatio = img.width / img.height;
                    const targetAspect = width / height;
                    let drawWidth = width;
                    let drawHeight = height;
                    let offsetX = 0;
                    let offsetY = 0;

                    if (aspectRatio > targetAspect) {
                        // Image plus large que la case
                        drawWidth = width;
                        drawHeight = width / aspectRatio;
                        offsetY = (height - drawHeight) / 2;
                    } else {
                        // Image plus haute que la case
                        drawHeight = height;
                        drawWidth = height * aspectRatio;
                        offsetX = (width - drawWidth) / 2;
                    }

                    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                    onImageLoad();
                };


                img.onerror = () => {
                    console.error("Erreur chargement image");
                    onImageLoad();
                };

                img.src = imageData.preview;
            });
        });
    };

    const handleChangeTop = (event) => {
        setTopText(event.target.value);
    };

    const handleChangeBot = (event) => {
        setBottomText(event.target.value);
    };

    useEffect(() => {
        if (selectedImages.length > 0) {
            const timeoutId = setTimeout(() => {
                generateMemeImage().catch(console.error);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [selectedImages, topText, bottomText, customTexts, displayMode, textColor, textBgColor, textBgOpacity]);

    const handleSaveMeme = async () => {
        if (!title.trim()) {
            toast.error('Veuillez ajouter un titre');
            return;
        }

        setIsSaving(true);
        try {
            // Étape 1: Générer et uploader l'image
            const blob = await generateMemeImage();
            if (!blob) {
                toast.error("Impossible de générer l'image");
                return;
            }

            const formData = new FormData();
            formData.append('image', blob, 'meme.png');

            // Upload vers Cloudinary
            const uploadResponse = await axios.post("https://memes-back.onrender.com/api/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Étape 2: Sauvegarder les métadonnées en base de données
            const memeData = {
                title: title.trim(),
                imageUrl: uploadResponse.data.imageUrl,
                cloudinaryId: uploadResponse.data.cloudinaryId,
            };

            await axios.post('https://memes-back.onrender.com/api/memes', memeData);

            toast.success('Meme sauvegardé avec succès!');
            resetForm();
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!preview) return;

        try {
            const response = await fetch(preview);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `${title || 'meme'}.png`;
            link.href = url;
            link.click();

            URL.revokeObjectURL(url);
            toast.success('Meme téléchargé!');
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            toast.error('Erreur lors du téléchargement');
        }
    };

    const resetForm = () => {
        selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
        setSelectedImages([]);
        setImageUrl('');
        setCloudinaryId('');
        setTopText('');
        setBottomText('');
        setTitle('');
        setCustomTexts([]);
        setPreview(null);
        setActiveImageIndex(0);
    };

    const handleShare = async () => {
        if (!preview) return;

        try {
            const response = await fetch(preview);
            const blob = await response.blob();
            const file = new File([blob], 'meme.png', { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Meme: ${title}`,
                    text: `Regardez ce meme que j'ai créé : ${title}`,
                    files: [file],
                });
            } else {
                navigator.clipboard.writeText(preview);
                toast.success('URL copiée dans le presse-papier');
            }
        } catch (error) {
            console.error("Erreur lors du partage:", error);
            toast.error("Partage impossible.");
        }
    };

    // CANVA 
    const handleCustomEditorSave = (canvasData) => {
        // Ici vous pouvez traiter les données du canvas personnalisé
        // Par exemple, les sauvegarder ou les intégrer à votre flux existant
        console.log('Canvas personnalisé sauvegardé:', canvasData);
        setShowCustomEditor(false);
    };

    return (
        <div className="meme-generator px-4 py-8 max-w-6xl mx-auto text-white ">
            <h1 className="text-4xl font-bold mb-8 text-center">Créateur de Memes</h1>

            <div className="mb-6">
                <button
                    onClick={() => setShowCustomEditor(true)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <span>Mode Personnalisation</span>
                </button>
                <p className="text-center text-sm text-white/70 mt-2">
                    Créez librement avec des outils de type Canva
                </p>
            </div>

            {/* Et ajoutez ceci à la fin de votre JSX, juste avant la fermeture du div principal */}
            {showCustomEditor && (
                <InteractifGen
                    onClose={() => setShowCustomEditor(false)}
                    onSave={handleCustomEditorSave}
                />
            )}

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
                {/* Section Mode d'affichage */}
                <h2 className="text-2xl font-semibold mb-4">1. Mode d'affichage</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                    {Object.entries(displayModes).map(([mode, info]) => (
                        <button
                            key={mode}
                            onClick={() => {
                                setDisplayMode(mode);
                                // Limiter les images selon le nouveau mode
                                const maxImages = info.maxImages;
                                if (selectedImages.length > maxImages) {
                                    const excess = selectedImages.slice(maxImages);
                                    excess.forEach(img => URL.revokeObjectURL(img.preview));
                                    setSelectedImages(prev => prev.slice(0, maxImages));
                                }
                            }}
                            className={`p-3 rounded-lg border-2 transition ${displayMode === mode
                                ? 'border-blue-400 bg-blue-500/30'
                                : 'border-white/30 bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            <div className="text-sm font-medium">{info.name}</div>
                            <div className="text-xs opacity-75">Max: {info.maxImages}</div>
                        </button>
                    ))}
                </div>

                {/* Section Upload */}
                <h2 className="text-2xl font-semibold mb-4">2. Ajouter des images</h2>
                <div className="mb-6">
                    <label htmlFor="image-upload" className="cursor-pointer block w-full text-center py-4 border-2 border-dashed border-white/50 rounded-xl hover:bg-white/10 transition">
                        {isUploading ? "📤 Upload en cours..." : `📸 Ajouter des images (${selectedImages.length}/${displayModes[displayMode].maxImages})`}
                    </label>
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple={displayModes[displayMode].maxImages > 1}
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>

                {/* Images uploadées */}
                {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {selectedImages.map((img, index) => (
                            <div key={img.id} className="relative group">
                                <img
                                    src={img.preview}
                                    alt={`Upload ${index + 1}`}
                                    className={`w-full h-24 object-cover rounded-lg border-2 cursor-pointer transition ${activeImageIndex === index ? 'border-blue-400' : 'border-white/30'
                                        }`}
                                    onClick={() => setActiveImageIndex(index)}
                                />
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                >
                                    ✕
                                </button>
                                {activeImageIndex === index && (
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-xs font-bold">ACTIF</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Configuration du texte */}
                {selectedImages.length > 0 && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">3. Configuration du texte</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm mb-2">Couleur du texte</label>
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                    className="w-full h-10 rounded border-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Couleur du fond</label>
                                <input
                                    type="color"
                                    value={textBgColor}
                                    onChange={(e) => setTextBgColor(e.target.value)}
                                    className="w-full h-10 rounded border-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Opacité du fond: {Math.round(textBgOpacity * 100)}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={textBgOpacity}
                                    onChange={(e) => setTextBgOpacity(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Section Texte */}
                        <h2 className="text-2xl font-semibold mb-4">4. Ajouter du texte</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Titre du meme"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg placeholder-white sm:col-span-2"
                            />
                            <input
                                type="text"
                                placeholder="Texte du haut"
                                value={topText}
                                onChange={handleChangeTop}
                                className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg placeholder-white"
                            />
                            <input
                                type="text"
                                placeholder="Texte du bas"
                                value={bottomText}
                                onChange={handleChangeBot}
                                className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg placeholder-white"
                            />
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => setTextEditMode(!textEditMode)}
                                className={`px-4 py-2 rounded-lg transition ${textEditMode
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {textEditMode ? '✓ Mode texte activé' : '✏️ Activer mode texte'}
                            </button>
                            {textEditMode && (
                                <span className="text-sm opacity-75">
                                    Cliquez sur l'aperçu pour ajouter du texte
                                </span>
                            )}
                        </div>

                        {/* Textes personnalisés */}
                        {customTexts.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Textes personnalisés:</h3>
                                <div className="space-y-2">
                                    {customTexts.map((textObj) => (
                                        <div key={textObj.id} className="flex items-center gap-2">
                                            {textObj.isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    onBlur={() => {
                                                        updateCustomText(textObj.id, editingText);
                                                        setEditingText('');
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateCustomText(textObj.id, editingText);
                                                            setEditingText('');
                                                        }
                                                    }}
                                                    className="bg-white/20 border border-white/30 text-white px-2 py-1 rounded text-sm flex-1"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm flex-1">"{textObj.text}"</span>
                                            )}

                                            <button
                                                onClick={() => removeCustomText(textObj.id)}
                                                className="bg-red-500/70 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Aperçu */}
                        <h2 className="text-2xl font-semibold mb-4">5. Aperçu</h2>
                        <div className="relative bg-white rounded-xl overflow-hidden shadow-xl p-4 max-w-2xl mx-auto mb-6">
                            {preview ? (
                                <div className="relative">
                                    <canvas
                                        ref={canvasRef}
                                        onClick={handleCanvasClick}
                                        className={`w-full rounded-md ${textEditMode ? 'cursor-crosshair' : ''}`}
                                        style={{ display: 'none' }}
                                    />
                                    <img
                                        src={preview}
                                        alt="preview"
                                        className={`w-full rounded-md ${textEditMode ? 'cursor-crosshair' : ''}`}
                                        onClick={handleCanvasClick}
                                    />
                                    {textEditMode && (
                                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                            Mode texte: cliquez pour ajouter
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                                    Aperçu du meme
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button onClick={handleSaveMeme} disabled={isSaving} className="action-btn save-btn">
                                {isSaving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
                            </button>
                            <button onClick={handleDownload} className="action-btn download-btn">
                                📥 Télécharger
                            </button>
                            <button onClick={handleShare} className="action-btn share-btn">
                                📤 Partager
                            </button>
                            <button onClick={resetForm} className="action-btn reset-btn">
                                🔄 Nouveau
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MemeGenerator;