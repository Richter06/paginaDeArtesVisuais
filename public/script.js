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



            galeria.innerHTML += `

    <div class="quadro">

        <img 
            src="${pintura.imagem}" 
            onclick="abrirImagem(this.src)"
            alt="${pintura.titulo}"
        >

        <h3>
            ${pintura.titulo}
        </h3>

        <p>
            ${pintura.tecnica}
        </p>

    </div>

`;


        });


    })

    .catch(erro => {

        console.error("Erro ao carregar pinturas:", erro);

    });