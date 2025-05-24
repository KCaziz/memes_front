import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Move, RotateCw, Copy, Trash2, Type, Image, Download, Palette } from 'lucide-react';
import { Image as ImageIcon } from "lucide-react";
import { Download as DownloadIcon } from "lucide-react";
import * as LucideIcons from 'lucide-react'; // Import global


const InteractifGen = ({ onClose, onSave }) => {
    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [canvasSize] = useState({ width: 800, height: 800 });
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textStyle, setTextStyle] = useState({
        fontSize: 32,
        color: '#000000',
        fontWeight: 'bold'
    });

    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Génération d'ID unique
    const generateId = () => Date.now() + Math.random();

    // Ajouter du texte
    const addText = () => {
        if (!textInput.trim()) return;

        const newElement = {
            id: generateId(),
            type: 'text',
            content: textInput,
            x: canvasSize.width / 2 - 100,
            y: canvasSize.height / 2,
            width: 200,
            height: 50,
            style: { ...textStyle },
            rotation: 0
        };

        setElements(prev => [...prev, newElement]);
        setTextInput('');
        setShowTextInput(false);
    };

    // Ajouter une image
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image(); // Utilisez window.Image pour le constructeur natif
            img.onload = () => {
                const maxSize = 200;
                const aspectRatio = img.width / img.height;
                let width = maxSize;
                let height = maxSize;

                if (aspectRatio > 1) {
                    height = maxSize / aspectRatio;
                } else {
                    width = maxSize * aspectRatio;
                }

                const newElement = {
                    id: generateId(),
                    type: 'image',
                    content: e.target.result,
                    x: canvasSize.width / 2 - width / 2,
                    y: canvasSize.height / 2 - height / 2,
                    width,
                    height,
                    rotation: 0
                };

                setElements(prev => [...prev, newElement]);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };
    // Gestion du drag & drop
    const handleMouseDown = useCallback((e, element) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectedElement(element.id);
        setIsDragging(true);
        setDragOffset({
            x: x - element.x,
            y: y - element.y
        });
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !selectedElement) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setElements(prev => prev.map(el =>
            el.id === selectedElement
                ? {
                    ...el,
                    x: Math.max(0, Math.min(canvasSize.width - el.width, x - dragOffset.x)),
                    y: Math.max(0, Math.min(canvasSize.height - el.height, y - dragOffset.y))
                }
                : el
        ));
    }, [isDragging, selectedElement, dragOffset, canvasSize]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Dupliquer un élément
    const duplicateElement = (elementId) => {
        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        const duplicated = {
            ...element,
            id: generateId(),
            x: element.x + 20,
            y: element.y + 20
        };

        setElements(prev => [...prev, duplicated]);
    };

    // Supprimer un élément
    const deleteElement = (elementId) => {
        setElements(prev => prev.filter(el => el.id !== elementId));
        if (selectedElement === elementId) {
            setSelectedElement(null);
        }
    };

    // Faire pivoter un élément
    const rotateElement = (elementId) => {
        setElements(prev => prev.map(el =>
            el.id === elementId
                ? { ...el, rotation: (el.rotation + 15) % 360 }
                : el
        ));
    };

    // Redimensionner un élément
    const resizeElement = (elementId, newWidth, newHeight) => {
        setElements(prev => prev.map(el =>
            el.id === elementId
                ? { ...el, width: Math.max(20, newWidth), height: Math.max(20, newHeight) }
                : el
        ));
    };
    const generateCanvasBlob = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
      
        // Fond blanc
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      
        for (const element of elements) {
          ctx.save();
          
          if (element.rotation) {
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }
      
          if (element.type === 'text') {
            ctx.font = `${element.style.fontWeight} ${element.style.fontSize}px ${element.style.fontFamily || 'Arial'}`;
            ctx.fillStyle = element.style.color;
            ctx.textBaseline = 'top';
            ctx.fillText(element.content, element.x, element.y);
          } 
          else if (element.type === 'image') {
            const img = new window.Image(); // Utilisez window.Image explicitement
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve; // Gestion des erreurs
              img.src = element.content;
            });
            ctx.drawImage(img, element.x, element.y, element.width, element.height);
          }
          
          ctx.restore();
        }
      
        return new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/png', 1);
        });
      };
      
      const downloadCanvas = async () => {
        try {
          const blob = await generateCanvasBlob();
          if (!blob) throw new Error('Erreur de génération');
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${title}.png`;
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
          console.error('Échec du téléchargement:', error);
          alert('Impossible de télécharger le meme');
        }
      };
    // Partager le canvas
    const shareCanvas = async () => {
        try {
            const blob = await generateCanvasBlob();
            const file = new File([blob], `${title}.png`, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Meme: ${title || 'Mon création'}`,
                    text: `Regardez ce meme que j'ai créé : ${title || 'Mon création'}`,
                    files: [file],
                });
            } else {
                // Fallback: copier un lien ou télécharger
                const url = URL.createObjectURL(blob);
                await navigator.clipboard.writeText(url);
                alert('Lien copié dans le presse-papier');
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Erreur lors du partage:", error);
            alert("Partage impossible.");
        }
    };

    // Sauvegarder en base de données (comme MemeGenerator)
    const handleSaveCanvas = async () => {
        if (!title.trim()) {
            alert('Veuillez ajouter un titre');
            return;
        }

        if (elements.length === 0) {
            alert('Créez au moins un élément avant de sauvegarder');
            return;
        }

        setIsSaving(true);
        try {
            // Étape 1: Générer le blob
            const blob = await generateCanvasBlob();
            if (!blob) {
                alert("Impossible de générer l'image");
                return;
            }

            // Étape 2: Upload vers Cloudinary
            const formData = new FormData();
            formData.append('image', blob, 'custom-meme.png');

            const uploadResponse = await fetch("https://memes-back.onrender.com/api/upload", {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Erreur upload');
            }

            const uploadData = await uploadResponse.json();

            // Étape 3: Sauvegarder en base de données
            const memeData = {
                title: title.trim(),
                imageUrl: uploadData.imageUrl,
                cloudinaryId: uploadData.cloudinaryId,
            };

            const saveResponse = await fetch('https://memes-back.onrender.com/api/memes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(memeData)
            });

            if (!saveResponse.ok) {
                throw new Error('Erreur sauvegarde');
            }

            alert('Meme sauvegardé avec succès!');

            // Optionnel: fermer l'éditeur après sauvegarde
            // onClose();

        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedEl = elements.find(el => el.id === selectedElement);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[70vh] mx-auto mb-0 sm:scale-[.85] flex flex-col md:flex-row ">

                {/* Panneau de contrôle */}
                <div className="bg-gray-50 p-3 sm:p-4 md:p-6 md:w-[40%] md:scale-[.95] scale-[.85]  overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200">

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Éditeur Canvas</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Outils d'ajout */}
                    <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-semibold text-gray-700">Ajouter des éléments</h3>

                        {/* Ajouter du texte */}
                        <div className="space-y-2">
                        <input
                                type="text"
                                placeholder="Titre"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/20 border border-black/30 text-black px-4 py-2 rounded-lg placeholder-gray sm:col-span-2"
                            />

                            <button
                                onClick={() => setShowTextInput(!showTextInput)}
                                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                <Type size={20} />
                                Ajouter du texte
                            </button>

                            {showTextInput && (
                                <div className="space-y-2 p-4 bg-white text-black rounded-lg border">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Votre texte..."
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-600">Taille</label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="72"
                                                value={textStyle.fontSize}
                                                onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                                                className="w-full"
                                            />
                                            <span className="text-xs">{textStyle.fontSize}px</span>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600">Couleur</label>
                                            <input
                                                type="color"
                                                value={textStyle.color}
                                                onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                                                className="w-full h-8 rounded border"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={addText}
                                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Ajouter une image */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                        >
                            <ImageIcon size={20} />
                            Ajouter une image
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                    {/* Contrôles de l'élément sélectionné */}
                    {selectedEl && (
                        <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <h3 className="text-lg font-semibold text-gray-700">Élément sélectionné</h3>

                            {/* Position */}
                            <div className="grid grid-cols-2 gap-2 text-black">
                                <div>
                                    <label className="text-xs text-gray-600">Position X</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedEl.x)}
                                        onChange={(e) => setElements(prev => prev.map(el =>
                                            el.id === selectedElement ? { ...el, x: parseInt(e.target.value) || 0 } : el
                                        ))}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Position Y</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedEl.y)}
                                        onChange={(e) => setElements(prev => prev.map(el =>
                                            el.id === selectedElement ? { ...el, y: parseInt(e.target.value) || 0 } : el
                                        ))}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </div>

                            {/* Taille */}
                            <div className="grid grid-cols-2 gap-2 text-black">
                                <div>
                                    <label className="text-xs text-gray-600">Largeur</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedEl.width)}
                                        onChange={(e) => resizeElement(selectedElement, parseInt(e.target.value) || 20, selectedEl.height)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Hauteur</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedEl.height)}
                                        onChange={(e) => resizeElement(selectedElement, selectedEl.width, parseInt(e.target.value) || 20)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => rotateElement(selectedElement)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition text-sm"
                                >
                                    <RotateCw size={16} />
                                </button>
                                <button
                                    onClick={() => duplicateElement(selectedElement)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => deleteElement(selectedElement)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Liste des éléments */}
                    {elements.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Éléments ({elements.length})</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto text-black">
                                {elements.map((element, index) => (
                                    <div
                                        key={element.id}
                                        onClick={() => setSelectedElement(element.id)}
                                        className={`p-2 rounded cursor-pointer border transition ${selectedElement === element.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">
                                            {element.type === 'text' ? '📝' : '🖼️'}
                                            {element.type === 'text'
                                                ? ` "${element.content.substring(0, 20)}${element.content.length > 20 ? '...' : ''}"`
                                                : ` Image ${index + 1}`
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Zone de canvas */}
                <div className="p-3 sm:p-4 md:p-6 bg-gray-50 md:bg-gray-100 flex flex-col overflow-y-auto transition-colors duration-200 sm:h-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-600">
                            Canvas: {canvasSize.width} × {canvasSize.height}px
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveCanvas}
                                disabled={isSaving || !title.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>

                            <button
                                onClick={downloadCanvas}
                                disabled={elements.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Télécharger
                            </button>

                            <button
                                onClick={shareCanvas}
                                disabled={elements.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Partager
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <div
                            ref={canvasRef}
                            className="relative bg-white shadow-lg border-2 border-gray-300"
                            style={{
                                width: canvasSize.width,
                                height: canvasSize.height,
                                maxWidth: '100%',
                                maxHeight: '100%'
                            }}
                            onClick={(e) => {
                                if (e.target === canvasRef.current) {
                                    setSelectedElement(null);
                                }
                            }}
                        >
                            {elements.map((element) => (
                                <div
                                    key={element.id}
                                    className={`absolute cursor-move border-2 ${selectedElement === element.id
                                        ? 'border-blue-500 border-dashed'
                                        : 'border-transparent hover:border-gray-300'
                                        }`}
                                    style={{
                                        left: element.x,
                                        top: element.y,
                                        width: element.width,
                                        height: element.height,
                                        transform: `rotate(${element.rotation}deg)`,
                                        transformOrigin: 'center center'
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, element)}
                                >
                                    {element.type === 'text' ? (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-center leading-tight overflow-hidden"
                                            style={{
                                                fontSize: element.style.fontSize,
                                                color: element.style.color,
                                                fontWeight: element.style.fontWeight,
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {element.content}
                                        </div>
                                    ) : (
                                        <img
                                            src={element.content}
                                            alt="Element"
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                        />
                                    )}

                                    {/* Poignées de redimensionnement pour l'élément sélectionné */}
                                    {selectedElement === element.id && (
                                        <>
                                            <div
                                                className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const startX = e.clientX;
                                                    const startY = e.clientY;
                                                    const startWidth = element.width;
                                                    const startHeight = element.height;

                                                    const handleResize = (e) => {
                                                        const deltaX = e.clientX - startX;
                                                        const deltaY = e.clientY - startY;
                                                        resizeElement(element.id, startWidth + deltaX, startHeight + deltaY);
                                                    };

                                                    const handleMouseUp = () => {
                                                        document.removeEventListener('mousemove', handleResize);
                                                        document.removeEventListener('mouseup', handleMouseUp);
                                                    };

                                                    document.addEventListener('mousemove', handleResize);
                                                    document.addEventListener('mouseup', handleMouseUp);
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}

                            {/* Grille */}
                            <div className="absolute inset-0 pointer-events-none opacity-10">
                                <svg width="100%" height="100%">
                                    <defs>
                                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000" strokeWidth="1" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractifGen;