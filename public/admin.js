const formulario = document.querySelector(".form-pintura");
const lista = document.querySelector(".lista-pinturas");

const tituloInput = document.querySelector("#titulo");
const tecnicaInput = document.querySelector("#tecnica");
const imagemInput = document.querySelector("#inputImagem");


const botaoSalvar = document.querySelector("#botaoSalvar");

const previewImagem = document.querySelector("#previewImagem");

let editando = null;


// ==========================
// PRÉVIA DA IMAGEM
// ==========================

imagemInput.addEventListener("change", () => {

    const arquivo = imagemInput.files[0];

    if (!arquivo) {

        previewImagem.src = "";

        previewImagem.style.display = "none";

        document.querySelector("#textoUpload").textContent =
            "Escolher imagem";

        return;

    }

    const url = URL.createObjectURL(arquivo);

    previewImagem.src = url;

    previewImagem.style.display = "block";

    document.querySelector("#textoUpload").textContent =
        arquivo.name;

});


// ==========================
// CARREGAR PINTURAS
// ==========================

function carregarPinturas() {

    fetch("/api/pinturas")

        .then(res => res.json())

        .then(pinturas => {

            lista.innerHTML = "";


            pinturas.forEach(pintura => {

                const card =
                    document.createElement("div");

                card.className =
                    "card-pintura";


                card.innerHTML = `

                    <img 
                        src="${pintura.imagem}" 
                        alt="${pintura.titulo}"
                    >

                    <h3>
                        ${pintura.titulo}
                    </h3>

                    <p>
                        ${pintura.tecnica}
                    </p>

                    <button
                        class="editar"
                        data-id="${pintura.id}">
                        Editar
                    </button>

                    <button
                        class="apagar"
                        data-id="${pintura.id}">
                        Excluir
                    </button>

                `;


                const editar =
                    card.querySelector(".editar");

                const apagar =
                    card.querySelector(".apagar");


                // ==========================
                // EDITAR
                // ==========================

                editar.addEventListener("click", () => {

                    editando = pintura.id;

                    tituloInput.value =
                        pintura.titulo;

                    tecnicaInput.value =
                        pintura.tecnica;

                    // Mostrar imagem atual
                    if (pintura.imagem) {

                        previewImagem.src =
                            pintura.imagem;

                        previewImagem.style.display =
                            "block";
                    }

                    if (botaoSalvar) {

                        botaoSalvar.textContent =
                            "Salvar alterações";
                    }

                    // Voltar para o formulário
                    const posicao =
                        formulario.getBoundingClientRect().top +
                        window.scrollY -
                        40;

                    window.scrollTo({

                        top: posicao,

                        behavior: "smooth"

                    });

                });

                // ==========================
                // EXCLUIR
                // ==========================

                apagar.addEventListener("click", () => {

                    const confirmar =
                        confirm(
                            `Deseja excluir "${pintura.titulo}"?`
                        );


                    if (!confirmar) {

                        return;

                    }


                    fetch(
                        `/api/pinturas/${pintura.id}`,
                        {
                            method: "DELETE"
                        }
                    )

                        .then(res => res.json())

                        .then(resposta => {

                            alert(
                                resposta.mensagem
                            );

                            carregarPinturas();

                        })

                        .catch(erro => {

                            console.error(erro);

                            alert(
                                "Erro ao excluir pintura."
                            );

                        });

                });


                lista.appendChild(card);

            });

        })

        .catch(erro => {

            console.error(erro);

            lista.innerHTML =
                "<p>Erro ao carregar pinturas.</p>";

        });

}


// ==========================
// SALVAR FORMULÁRIO
// ==========================

formulario.addEventListener("submit", (e) => {

    e.preventDefault();


    const dados = new FormData();


    dados.append(
        "titulo",
        tituloInput.value
    );


    dados.append(
        "tecnica",
        tecnicaInput.value
    );


    // Só envia imagem se uma nova foi escolhida

    if (imagemInput.files.length > 0) {

        dados.append(
            "imagem",
            imagemInput.files[0]
        );

    }


    // ==========================
    // NOVA PINTURA
    // ==========================

    if (editando === null) {

        if (imagemInput.files.length === 0) {

            alert(
                "Escolha uma imagem."
            );

            return;

        }


        fetch("/api/pinturas", {

            method: "POST",

            body: dados

        })

            .then(res => res.json())

            .then(resposta => {

                alert(
                    resposta.mensagem
                );


                formulario.reset();


                // Limpar prévia

                previewImagem.src = "";

                previewImagem.style.display =
                    "none";


                carregarPinturas();

            })

            .catch(erro => {

                console.error(erro);

                alert(
                    "Erro ao cadastrar pintura."
                );

            });

    }


    // ==========================
    // EDITAR PINTURA
    // ==========================

    else {

        fetch(
            `/api/pinturas/${editando}`,
            {

                method: "PUT",

                body: dados

            }
        )

            .then(res => res.json())

            .then(resposta => {

                alert(
                    resposta.mensagem
                );


                editando = null;


                formulario.reset();


                // Limpar prévia

                previewImagem.src = "";

                previewImagem.style.display =
                    "none";


                if (botaoSalvar) {

                    botaoSalvar.textContent =
                        "Adicionar ao acervo";

                }


                carregarPinturas();

            })

            .catch(erro => {

                console.error(erro);

                alert(
                    "Erro ao editar pintura."
                );

            });

    }

});


// ==========================
// CARREGAR
// ==========================

carregarPinturas();