import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ProtectedPage = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Verifica se a pessoa tem a chave (agora lendo do sessionStorage ou localStorage antigo)
    const token = sessionStorage.getItem("rh_token") || localStorage.getItem("rh_token");
    
    if (!token) {
      navigate("/login");
      return;
    }

    // 👇 2. CRONÔMETRO DE INATIVIDADE (15 minutos = 900.000 milissegundos)
    const INACTIVITY_TIME = 15 * 60 * 1000; 
    let timeoutId;

    const logoutUser = () => {
      // Destrói as chaves de acesso
      sessionStorage.removeItem("rh_token");
      sessionStorage.removeItem("rh_user");
      localStorage.removeItem("rh_token"); // Limpa caso tenha ficado algum antigo
      localStorage.removeItem("rh_user");
      
      alert("🔒 Sua sessão expirou por inatividade para sua segurança. Por favor, faça login novamente.");
      navigate("/login");
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutUser, INACTIVITY_TIME);
    };

    // 3. Os "Radares" de movimento (Mouse, Teclado, Rolagem, Cliques)
    const events = ["mousemove", "keydown", "scroll", "click"];
    
    // Ativa os radares
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Dá o play no cronômetro a primeira vez
    resetTimer();

    // Quando o usuário sai da tela, a gente desliga os radares para não pesar o sistema
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };

  }, [navigate]);

  return children;
};