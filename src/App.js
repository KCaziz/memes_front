import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MemeGenerator from './components/MemeGenerator';
import Gallery from './components/Gallery';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              🎭 Générateur de memes
            </Link>
            <div className="nav-menu">
              <Link to="/" className="nav-link">
                Créer
              </Link>
              <Link to="/gallery" className="nav-link">
                Galerie
              </Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MemeGenerator />} />
            <Route path="/gallery" element={<Gallery />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p className='text-white'>&copy; 2024 Générateur de memes - Créé avec React & Express</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;