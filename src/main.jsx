import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
	state = { error: null };

	static getDerivedStateFromError(error) {
		return { error };
	}

	render() {
		if (!this.state.error) return this.props.children;
		return <main className="app-error"><div><span className="eyebrow">Daymoment</span><h1>Halaman tidak dapat ditampilkan</h1><p>{this.state.error.message || 'Terjadi kesalahan pada aplikasi.'}</p><button className="button button-primary" type="button" onClick={() => window.location.reload()}>Muat ulang halaman</button>{import.meta.env.DEV && <pre>{this.state.error.stack}</pre>}</div></main>;
	}
}

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>);
