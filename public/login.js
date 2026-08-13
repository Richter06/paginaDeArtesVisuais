const senha = document.querySelector("#senha");
const erroLogin = document.querySelector("#erroLogin");
const btnEntrar = document.querySelector("#btnEntrar");

btnEntrar.addEventListener("click", entrar);

function entrar() {
    erroLogin.classList.remove("ativo");
    senha.classList.remove("erro");

    fetch("/login", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            senha: senha.value
        })
    })
    .then(res => {
        if (res.ok) {
            window.location.href = "/admin.html";
        } else {
            erroLogin.classList.add("ativo");
            senha.classList.add("erro");
            senha.focus();
        }
    })
    .catch(() => {
        erroLogin.textContent = "Erro ao conectar ao servidor.";
        erroLogin.classList.add("ativo");
    });
}