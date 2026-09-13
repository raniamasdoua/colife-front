import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Pas de <StrictMode> : react-oidc-context traite le retour de Keycloak (échange
// du code d'autorisation) dans un effet au montage. En dev, StrictMode monte les
// composants deux fois et déclenche ce traitement deux fois — le code étant à
// usage unique, le 2ᵉ appel échoue et réinitialise l'auth à "non connecté" juste
// après un login/une validation d'email réussis (retour furtif sur /welcome).
createRoot(document.getElementById('root')!).render(<App />)
