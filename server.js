require("dotenv").config();





const express = require("express");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const supabase = require("./supabase/supabase");
const db = require("./database/database");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");



const app = express();


app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),

                "img-src": [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://nnzpqihvacqmuhckxfis.supabase.co"
                ]
            }
        }
    })
);

const PORT = 3000;

const SENHA_ADMIN = process.env.SENHA_ADMIN;

// =====================================
// SESSÃO
// =====================================

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        maxAge: 1000 * 60 * 60 * 24,

        httpOnly: true,

        sameSite: "strict"

    }

}));

// =====================================
// MIDDLEWARES
// =====================================

app.use(express.json());

app.use(express.urlencoded({

    extended: true

}));

app.use(express.static("public"));

// =====================================
// LOGIN
// =====================================


//Login rate limiter
const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutos

    max: 5, // 5 tentativas

    message: {

        erro: "Muitas tentativas de login. Aguarde 15 minutos."

    },

    standardHeaders: true,

    legacyHeaders: false

});




app.post("/login", loginLimiter, (req, res) => {

    const { senha } = req.body;


    if (!SENHA_ADMIN) {

        return res.status(500).json({

            erro: "Senha do administrador não configurada."

        });

    }


    if (senha !== SENHA_ADMIN) {

        return res.status(401).json({

            erro: "Senha incorreta."

        });

    }


    req.session.regenerate((erro) => {

        if (erro) {

            console.error(erro);

            return res.status(500).json({

                erro: "Erro ao criar sessão."

            });

        }


        req.session.logado = true;


        res.json({

            sucesso: true

        });

    });

});

app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login.html");

    });

});

// =====================================
// PROTEGER PAINEL
// =====================================

app.get("/admin.html", (req, res, next) => {

    if (!req.session.logado) {

        return res.redirect("/login.html");

    }

    next();

});

// =====================================
// MIDDLEWARE LOGIN
// =====================================

function verificarLogin(req, res, next) {

    if (!req.session.logado) {

        return res.status(401).json({

            erro: "Não autorizado"

        });

    }

    next();

}

// =====================================
// MULTER
// =====================================

const armazenamento = multer.memoryStorage();

const upload = multer({

    storage: armazenamento,

    limits: {

        fileSize: 5 * 1024 * 1024

    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype.startsWith("image/")) {

            cb(null, true);

        } else {

            cb(new Error("Somente imagens são permitidas."));

        }

    }

});

// =====================================
// TESTE
// =====================================

app.get("/api/teste", (req, res) => {

    res.json({

        mensagem: "API funcionando!"

    });

});

// =====================================
// LISTAR PINTURAS
// =====================================

app.get("/api/pinturas", async (req, res) => {

    try {

        const pinturas = await db.listarPinturas();

        res.json(pinturas);

    }

    catch (erro) {

        console.error(erro);

        res.status(500).json({

            erro: erro.message

        });

    }

});

// =====================================
// CADASTRAR PINTURA
// =====================================

app.post(
    "/api/pinturas",
    verificarLogin,
    upload.single("imagem"),
    async (req, res) => {

        try {

            const { titulo, tecnica } = req.body;

            if (!titulo || !tecnica || !req.file) {

                return res.status(400).json({

                    erro: "Preencha todos os campos."

                });

            }

            const nomeArquivo =
                Date.now() +
                path.extname(req.file.originalname);

            const { error: erroUpload } =
                await supabase
                    .storage
                    .from("obras")
                    .upload(
                        nomeArquivo,
                        req.file.buffer,
                        {

                            contentType:
                                req.file.mimetype

                        }
                    );

            if (erroUpload) {

                return res.status(500).json({

                    erro: erroUpload.message

                });

            }

            const { data } =
                supabase
                    .storage
                    .from("obras")
                    .getPublicUrl(nomeArquivo);

            const urlImagem =
                data.publicUrl;

            const pintura =
                await db.criarPintura(

                    titulo,

                    tecnica,

                    urlImagem

                );

            res.json({

                mensagem:
                    "Pintura criada.",

                id: pintura.id

            });

        }

        catch (erro) {

            console.error(erro);

            res.status(500).json({

                erro: erro.message

            });

        }

    }

);






// =====================================
// EDITAR PINTURA
// =====================================

app.put(
    "/api/pinturas/:id",
    verificarLogin,
    upload.single("imagem"),
    async (req, res) => {

        try {

            const id = req.params.id;

            const {

                titulo,

                tecnica

            } = req.body;

            const pintura =
                await db.buscarPintura(id);

            if (!pintura) {

                return res.status(404).json({

                    erro:
                        "Pintura não encontrada."

                });

            }

            let imagem =
                pintura.imagem;

            if (req.file) {

                const nomeArquivo =
                    Date.now() +
                    path.extname(
                        req.file.originalname
                    );

                const { error } =
                    await supabase
                        .storage
                        .from("obras")
                        .upload(
                            nomeArquivo,
                            req.file.buffer,
                            {

                                contentType:
                                    req.file.mimetype

                            }
                        );

                if (error) {

                    return res.status(500).json({

                        erro:
                            error.message

                    });

                }

                const { data } =
                    supabase
                        .storage
                        .from("obras")
                        .getPublicUrl(
                            nomeArquivo
                        );

                imagem =
                    data.publicUrl;

                const antigo =
                    new URL(pintura.imagem)
                        .pathname
                        .split("/obras/")
                        .pop();

                await supabase
                    .storage
                    .from("obras")
                    .remove([antigo]);

            }

            await db.editarPintura(

                id,

                titulo,

                tecnica,

                imagem

            );

            res.json({

                mensagem:
                    "Pintura atualizada."

            });

        }

        catch (erro) {

            console.error(erro);

            res.status(500).json({

                erro: erro.message

            });

        }

    }

);

// =====================================
// APAGAR PINTURA
// =====================================

app.delete(
    "/api/pinturas/:id",
    verificarLogin,
    async (req, res) => {

        try {

            const id = req.params.id;


            const pintura =
                await db.buscarPintura(id);


            if (!pintura) {

                return res.status(404).json({

                    erro:
                        "Pintura não encontrada."

                });

            }


            if (pintura.imagem) {

                const caminhoArquivo =
                    new URL(pintura.imagem)
                        .pathname
                        .split("/obras/")
                        .pop();


                const { error } =
                    await supabase
                        .storage
                        .from("obras")
                        .remove([
                            caminhoArquivo
                        ]);


                if (error) {

                    console.error(
                        "Erro ao apagar imagem:",
                        error
                    );

                }

            }


            await db.apagarPintura(id);


            res.json({

                mensagem:
                    "Pintura apagada."

            });


        }

        catch (erro) {

            console.error(erro);

            res.status(500).json({

                erro:
                    erro.message

            });

        }

    }

);

// =====================================
// SERVIDOR
// =====================================

app.listen(PORT, () => {

    console.log(

        `Servidor rodando em http://localhost:${PORT}`

    );

});