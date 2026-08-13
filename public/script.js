function abrirImagem(src) {

    const modal = document.getElementById("modal");

    const img = document.getElementById("imagemModal");


    img.src = src;


    modal.style.display = "flex";

}



function fecharImagem() {

    document.getElementById("modal").style.display = "none";

}





// Animação ao aparecer

const elementos = document.querySelectorAll(
    ".quadro, .bio, .foto-artista, section"
);



const observer = new IntersectionObserver((items) => {


    items.forEach(item => {


        if (item.isIntersecting) {

            item.target.classList.add("mostrar");

        }


    });


});



elementos.forEach(el => observer.observe(el));







// Buscar pinturas do banco

fetch("/api/pinturas")


    .then(res => res.json())


    .then(pinturas => {


        const galeria = document.getElementById("galeria");



        pinturas.forEach(pintura => {

            const quadro = document.createElement("div");
            quadro.className = "quadro";

            const imagem = document.createElement("img");
            imagem.src = pintura.imagem;
            imagem.alt = pintura.titulo;
            imagem.addEventListener("click", () => {
                abrirImagem(imagem.src);
            });

            const titulo = document.createElement("h3");
            titulo.textContent = pintura.titulo;

            const tecnica = document.createElement("p");
            tecnica.textContent = pintura.tecnica;

            quadro.appendChild(imagem);
            quadro.appendChild(titulo);
            quadro.appendChild(tecnica);

            galeria.appendChild(quadro);

        });


    })

    .catch(erro => {

        console.error("Erro ao carregar pinturas:", erro);

    });