import { Show, SignIn, UserButton } from '@clerk/react';

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Si el usuario no está logueado, ve directamente el formulario en pantalla */}
      <Show when="signed-out">
        <SignIn />
      </Show>

      {/* Si el usuario se loguea, ve su botón de perfil */}
      <Show when="signed-in">
        <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p>¡Sesión iniciada con éxito!</p>
          <UserButton />
        </div>
      </Show>
    </div>
  );
}

export default App;
