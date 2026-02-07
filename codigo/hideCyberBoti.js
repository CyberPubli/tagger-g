function ocultarCyberBoti() {
  const parrafos = document.querySelectorAll('p');
  let contador = 0;
  
  for (let p of parrafos) {
    if (p.textContent.includes('Cyber BOTI')) {
      // Subir 5 niveles desde el <p>
      let actual = p;
      for (let i = 0; i < 5; i++) {
        actual = actual.parentElement;
      }
      
      // Ocultar el div padre de 5 niveles arriba y marcar para ignorar
      if (actual) {
        actual.style.display = 'none';
        actual.setAttribute('data-skip-cyberboti', 'true');
        contador++;
      }
    }
  }
  
  return contador;
}
