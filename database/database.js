const supabase = require("../supabase/supabase");

async function listarPinturas() {

    const { data, error } = await supabase
        .from("pinturas")
        .select("*")
        .order("id", { ascending: false });

    if (error) throw error;

    return data;

}

async function buscarPintura(id) {

    const { data, error } = await supabase
        .from("pinturas")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;

    return data;

}

async function criarPintura(titulo, tecnica, imagem) {

    const { data, error } = await supabase
        .from("pinturas")
        .insert([
            {
                titulo,
                tecnica,
                imagem
            }
        ])
        .select()
        .single();

    if (error) throw error;

    return data;

}

async function editarPintura(id, titulo, tecnica, imagem) {

    const { data, error } = await supabase
        .from("pinturas")
        .update({
            titulo,
            tecnica,
            imagem
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return data;

}

async function apagarPintura(id) {

    const { error } = await supabase
        .from("pinturas")
        .delete()
        .eq("id", id);

    if (error) throw error;

}

module.exports = {

    listarPinturas,

    buscarPintura,

    criarPintura,

    editarPintura,

    apagarPintura

};