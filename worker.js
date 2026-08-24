import { createClient } from "@supabase/supabase-js";

// ======================================================
// CRIAR ASSINATURA DA SESSÃO
// ======================================================

async function criarAssinatura(valor, segredo) {
    const encoder = new TextEncoder();

    const chave = await crypto.subtle.importKey(
        "raw",
        encoder.encode(segredo),
        {
            name: "HMAC",
            hash: "SHA-256"
        },
        false,
        ["sign"]
    );

    const assinatura = await crypto.subtle.sign(
        "HMAC",
        chave,
        encoder.encode(valor)
    );

    return btoa(
        String.fromCharCode(
            ...new Uint8Array(assinatura)
        )
    );
}

// ======================================================
// VALIDAR COOKIE DE SESSÃO
// ======================================================

async function usuarioLogado(request, env) {
    const cookie = request.headers.get("Cookie") || "";

    const match = cookie.match(/(?:^|;\s*)sessao=([^;]+)/);

    if (!match) {
        return false;
    }

    const token = match[1];

    // O token possui:
    //
    // timestamp.uuid.assinatura
    //
    // Como timestamp + uuid possuem um ponto,
    // precisamos separar pelo ÚLTIMO ponto.

    const ultimoPonto = token.lastIndexOf(".");

    if (ultimoPonto === -1) {
        return false;
    }

    const valor = token.slice(0, ultimoPonto);
    const assinatura = token.slice(ultimoPonto + 1);

    if (!valor || !assinatura) {
        return false;
    }

    if (!env.SESSION_SECRET) {
        console.error("SESSION_SECRET não configurado.");
        return false;
    }

    const assinaturaEsperada = await criarAssinatura(
        valor,
        env.SESSION_SECRET
    );

    return assinatura === assinaturaEsperada;
}

// ======================================================
// LER DADOS DO LOGIN
// Aceita JSON e application/x-www-form-urlencoded
// ======================================================

async function obterDadosLogin(request) {
    const contentType =
        request.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
        return await request.json();
    }

    if (
        contentType.includes(
            "application/x-www-form-urlencoded"
        )
    ) {
        const formData = await request.formData();

        return {
            senha: formData.get("senha")
        };
    }

    return {};
}

// ======================================================
// WORKER
// ======================================================

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        const supabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_ANON_KEY
        );

        // ==================================================
        // LOGIN
        // ==================================================

        if (
            url.pathname === "/login" &&
            request.method === "POST"
        ) {
            try {
                const body =
                    await obterDadosLogin(request);

                const senha = body?.senha;

                // --------------------------------------------------
                // SENHA VAZIA
                // --------------------------------------------------

                if (!senha) {
                    return Response.json(
                        {
                            erro: "Digite a senha."
                        },
                        {
                            status: 400
                        }
                    );
                }

                // --------------------------------------------------
                // VERIFICAR SENHA CONFIGURADA
                // --------------------------------------------------

                if (!env.SENHA_ADMIN) {
                    return Response.json(
                        {
                            erro:
                                "SENHA_ADMIN não está configurada no Worker."
                        },
                        {
                            status: 500
                        }
                    );
                }

                // --------------------------------------------------
                // VERIFICAR SENHA
                // --------------------------------------------------

                if (senha !== env.SENHA_ADMIN) {
                    return Response.json(
                        {
                            erro: "Senha incorreta."
                        },
                        {
                            status: 401
                        }
                    );
                }

                // ==================================================
                // CRIAR IDENTIFICADOR DA SESSÃO
                // ==================================================

                const valor =
                    `${Date.now()}.${crypto.randomUUID()}`;

                // ==================================================
                // ASSINAR SESSÃO
                // ==================================================

                const assinatura =
                    await criarAssinatura(
                        valor,
                        env.SESSION_SECRET
                    );

                // ==================================================
                // CRIAR TOKEN
                // ==================================================

                const token =
                    `${valor}.${assinatura}`;

                // ==================================================
                // LOGIN OK
                //
                // Agora o Worker já manda o navegador
                // diretamente para /admin.html
                // ==================================================

                return new Response(null, {
                    status: 302,

                    headers: {
                        "Location": "/admin.html",

                        "Set-Cookie":
                            `sessao=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
                    }
                });
            }

            catch (erro) {
                console.error(
                    "Erro no login:",
                    erro
                );

                return Response.json(
                    {
                        erro:
                            "Erro ao processar login."
                    },
                    {
                        status: 500
                    }
                );
            }
        }

        // ==================================================
        // LOGOUT
        // ==================================================

        if (
            url.pathname === "/logout" &&
            request.method === "GET"
        ) {
            return new Response(null, {
                status: 302,

                headers: {
                    "Location": "/login.html",

                    "Set-Cookie":
                        "sessao=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
                }
            });
        }

        // ==================================================
        // PROTEGER ADMIN.HTML
        // ==================================================

        if (
            url.pathname === "/admin.html"
        ) {
            const logado =
                await usuarioLogado(
                    request,
                    env
                );

            if (!logado) {
                return Response.redirect(
                    `${url.origin}/login.html`,
                    302
                );
            }
        }

        // ==================================================
        // GET /api/pinturas
        // PÚBLICO
        // ==================================================

        if (
            url.pathname === "/api/pinturas" &&
            request.method === "GET"
        ) {
            try {
                const {
                    data,
                    error
                } = await supabase
                    .from("pinturas")
                    .select("*")
                    .order(
                        "id",
                        {
                            ascending: false
                        }
                    );

                if (error) {
                    return Response.json(
                        {
                            erro:
                                error.message
                        },
                        {
                            status: 500
                        }
                    );
                }

                return Response.json(data);
            }

            catch (erro) {
                console.error(
                    "Erro ao listar pinturas:",
                    erro
                );

                return Response.json(
                    {
                        erro:
                            erro.message
                    },
                    {
                        status: 500
                    }
                );
            }
        }

        // ==================================================
        // VERIFICAR AUTENTICAÇÃO DAS APIs ADMIN
        // ==================================================

        const ehAdminAPI =
            url.pathname === "/api/pinturas" ||
            url.pathname.startsWith(
                "/api/pinturas/"
            );

        if (
            ehAdminAPI &&
            (
                request.method === "POST" ||
                request.method === "PUT" ||
                request.method === "DELETE"
            )
        ) {
            const logado =
                await usuarioLogado(
                    request,
                    env
                );

            if (!logado) {
                return Response.json(
                    {
                        erro:
                            "Não autorizado."
                    },
                    {
                        status: 401
                    }
                );
            }
        }

        // ==================================================
        // POST /api/pinturas
        // CRIAR PINTURA
        // ==================================================

        if (
            url.pathname === "/api/pinturas" &&
            request.method === "POST"
        ) {
            try {
                const formData =
                    await request.formData();

                const titulo =
                    formData.get("titulo");

                const tecnica =
                    formData.get("tecnica");

                const arquivo =
                    formData.get("imagem");

                if (
                    !titulo ||
                    !tecnica ||
                    !arquivo
                ) {
                    return Response.json(
                        {
                            erro:
                                "Preencha todos os campos."
                        },
                        {
                            status: 400
                        }
                    );
                }

                // ==================================================
                // VALIDAR IMAGEM
                // ==================================================

                const tiposPermitidos = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (
                    !tiposPermitidos.includes(
                        arquivo.type
                    )
                ) {
                    return Response.json(
                        {
                            erro:
                                "Somente imagens JPEG, PNG ou WebP são permitidas."
                        },
                        {
                            status: 400
                        }
                    );
                }

                if (
                    arquivo.size >
                    5 * 1024 * 1024
                ) {
                    return Response.json(
                        {
                            erro:
                                "A imagem deve ter no máximo 5 MB."
                        },
                        {
                            status: 400
                        }
                    );
                }

                // ==================================================
                // GERAR NOME DO ARQUIVO
                // ==================================================

                const extensao =
                    arquivo.name
                        .split(".")
                        .pop()
                        .toLowerCase();

                const nomeArquivo =
                    `${Date.now()}.${extensao}`;

                const buffer =
                    await arquivo.arrayBuffer();

                // ==================================================
                // UPLOAD SUPABASE
                // ==================================================

                const {
                    error: erroUpload
                } = await supabase
                    .storage
                    .from("obras")
                    .upload(
                        nomeArquivo,
                        buffer,
                        {
                            contentType:
                                arquivo.type
                        }
                    );

                if (erroUpload) {
                    return Response.json(
                        {
                            erro:
                                erroUpload.message
                        },
                        {
                            status: 500
                        }
                    );
                }

                // ==================================================
                // URL PÚBLICA
                // ==================================================

                const {
                    data: urlData
                } = supabase
                    .storage
                    .from("obras")
                    .getPublicUrl(
                        nomeArquivo
                    );

                const urlImagem =
                    urlData.publicUrl;

                // ==================================================
                // SALVAR NO BANCO
                // ==================================================

                const {
                    data: pintura,
                    error
                } = await supabase
                    .from("pinturas")
                    .insert([
                        {
                            titulo,
                            tecnica,
                            imagem:
                                urlImagem
                        }
                    ])
                    .select()
                    .single();

                // ==================================================
                // SE BANCO FALHAR,
                // APAGAR IMAGEM
                // ==================================================

                if (error) {
                    await supabase
                        .storage
                        .from("obras")
                        .remove([
                            nomeArquivo
                        ]);

                    return Response.json(
                        {
                            erro:
                                error.message
                        },
                        {
                            status: 500
                        }
                    );
                }

                return Response.json(
                    {
                        mensagem:
                            "Pintura criada.",
                        pintura
                    },
                    {
                        status: 200
                    }
                );
            }

            catch (erro) {
                console.error(
                    "Erro ao criar pintura:",
                    erro
                );

                return Response.json(
                    {
                        erro:
                            erro.message
                    },
                    {
                        status: 500
                    }
                );
            }
        }

        // ==================================================
        // PUT /api/pinturas/:id
        // EDITAR PINTURA
        // ==================================================

        if (
            url.pathname.startsWith(
                "/api/pinturas/"
            ) &&
            request.method === "PUT"
        ) {
            try {
                const id =
                    url.pathname
                        .split("/")
                        .pop();

                const formData =
                    await request.formData();

                const titulo =
                    formData.get("titulo");

                const tecnica =
                    formData.get("tecnica");

                const arquivo =
                    formData.get("imagem");

                // ==================================================
                // BUSCAR PINTURA
                // ==================================================

                const {
                    data: pintura,
                    error: erroBusca
                } = await supabase
                    .from("pinturas")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (
                    erroBusca ||
                    !pintura
                ) {
                    return Response.json(
                        {
                            erro:
                                "Pintura não encontrada."
                        },
                        {
                            status: 404
                        }
                    );
                }

                let imagem =
                    pintura.imagem;

                let novoArquivo = null;

                // ==================================================
                // NOVA IMAGEM
                // ==================================================

                if (
                    arquivo &&
                    typeof arquivo === "object" &&
                    arquivo.size > 0
                ) {
                    const tiposPermitidos = [
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ];

                    if (
                        !tiposPermitidos.includes(
                            arquivo.type
                        )
                    ) {
                        return Response.json(
                            {
                                erro:
                                    "Formato de imagem inválido."
                            },
                            {
                                status: 400
                            }
                        );
                    }

                    if (
                        arquivo.size >
                        5 * 1024 * 1024
                    ) {
                        return Response.json(
                            {
                                erro:
                                    "A imagem deve ter no máximo 5 MB."
                            },
                            {
                                status: 400
                            }
                        );
                    }

                    const extensao =
                        arquivo.name
                            .split(".")
                            .pop()
                            .toLowerCase();

                    novoArquivo =
                        `${Date.now()}.${extensao}`;

                    const buffer =
                        await arquivo.arrayBuffer();

                    const {
                        error
                    } = await supabase
                        .storage
                        .from("obras")
                        .upload(
                            novoArquivo,
                            buffer,
                            {
                                contentType:
                                    arquivo.type
                            }
                        );

                    if (error) {
                        return Response.json(
                            {
                                erro:
                                    error.message
                            },
                            {
                                status: 500
                            }
                        );
                    }

                    const {
                        data
                    } = supabase
                        .storage
                        .from("obras")
                        .getPublicUrl(
                            novoArquivo
                        );

                    imagem =
                        data.publicUrl;
                }

                // ==================================================
                // ATUALIZAR BANCO
                // ==================================================

                const {
                    error: erroUpdate
                } = await supabase
                    .from("pinturas")
                    .update({
                        titulo,
                        tecnica,
                        imagem
                    })
                    .eq("id", id);

                if (erroUpdate) {

                    // Se subiu uma imagem nova
                    // mas o banco falhou, apagar a nova.

                    if (novoArquivo) {
                        await supabase
                            .storage
                            .from("obras")
                            .remove([
                                novoArquivo
                            ]);
                    }

                    return Response.json(
                        {
                            erro:
                                erroUpdate.message
                        },
                        {
                            status: 500
                        }
                    );
                }

                // ==================================================
                // APAGAR IMAGEM ANTIGA
                // ==================================================

                if (
                    novoArquivo &&
                    pintura.imagem
                ) {
                    try {
                        const antigo =
                            new URL(
                                pintura.imagem
                            )
                                .pathname
                                .split(
                                    "/obras/"
                                )
                                .pop();

                        if (antigo) {
                            await supabase
                                .storage
                                .from("obras")
                                .remove([
                                    antigo
                                ]);
                        }
                    }

                    catch (erro) {
                        console.error(
                            "Erro ao remover imagem antiga:",
                            erro
                        );
                    }
                }

                return Response.json({
                    mensagem:
                        "Pintura atualizada."
                });
            }

            catch (erro) {
                console.error(
                    "Erro ao editar pintura:",
                    erro
                );

                return Response.json(
                    {
                        erro:
                            erro.message
                    },
                    {
                        status: 500
                    }
                );
            }
        }

        // ==================================================
        // DELETE /api/pinturas/:id
        // EXCLUIR PINTURA
        // ==================================================

        if (
            url.pathname.startsWith(
                "/api/pinturas/"
            ) &&
            request.method === "DELETE"
        ) {
            try {
                const id =
                    url.pathname
                        .split("/")
                        .pop();

                // ==================================================
                // BUSCAR PINTURA
                // ==================================================

                const {
                    data: pintura,
                    error
                } = await supabase
                    .from("pinturas")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (
                    error ||
                    !pintura
                ) {
                    return Response.json(
                        {
                            erro:
                                "Pintura não encontrada."
                        },
                        {
                            status: 404
                        }
                    );
                }

                // ==================================================
                // APAGAR IMAGEM
                // ==================================================

                if (pintura.imagem) {
                    try {
                        const arquivo =
                            new URL(
                                pintura.imagem
                            )
                                .pathname
                                .split(
                                    "/obras/"
                                )
                                .pop();

                        if (arquivo) {
                            await supabase
                                .storage
                                .from("obras")
                                .remove([
                                    arquivo
                                ]);
                        }
                    }

                    catch (erro) {
                        console.error(
                            "Erro ao remover imagem:",
                            erro
                        );
                    }
                }

                // ==================================================
                // APAGAR REGISTRO
                // ==================================================

                const {
                    error: erroDelete
                } = await supabase
                    .from("pinturas")
                    .delete()
                    .eq("id", id);

                if (erroDelete) {
                    return Response.json(
                        {
                            erro:
                                erroDelete.message
                        },
                        {
                            status: 500
                        }
                    );
                }

                return Response.json({
                    mensagem:
                        "Pintura apagada."
                });
            }

            catch (erro) {
                console.error(
                    "Erro ao apagar pintura:",
                    erro
                );

                return Response.json(
                    {
                        erro:
                            erro.message
                    },
                    {
                        status: 500
                    }
                );
            }
        }

        // ==================================================
        // ARQUIVOS ESTÁTICOS
        // ==================================================

        return env.ASSETS.fetch(request);
    }
};