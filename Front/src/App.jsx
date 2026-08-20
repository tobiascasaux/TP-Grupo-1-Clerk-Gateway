import { useState } from 'react';
import { Show, SignIn, UserButton } from '@clerk/react';
import { useApi } from './lib/useApi';
import './App.css';

function App() {
  const { apiFetch } = useApi();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  async function probarGateway() {
    setEnviando(true);
    setError(null);
    setResultado(null);

    try {
      const data = await apiFetch('/api/survey', {
        method: 'POST',
        body: JSON.stringify({ surveyData: { destino: 'Mendoza' } }),
      });
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-container">
      {/* Si el usuario no está logueado, ve directamente el formulario en pantalla */}
      <Show when="signed-out">
        <SignIn />
      </Show>

      {/* Si el usuario se loguea, ve su botón de perfil */}
      <Show when="signed-in">
        <div className="session-info">
          <p>¡Sesión iniciada con éxito!</p>
          <UserButton />

          <button onClick={probarGateway} disabled={enviando}>
            {enviando ? 'Probando...' : 'Probar gateway'}
          </button>

          {error && <p className="session-error">{error}</p>}
          {resultado && (
            <pre style={{ color: '#8ce99a', fontSize: '12px' }}>
              {JSON.stringify(resultado, null, 2)}
            </pre>
          )}
        </div>
      </Show>
    </div>
  );
}

export default App;