const http = require('http')
let tempoestampa = Date.now()
const hostname = "192.168.0.105"
const port = 80
const fs = require('fs')
const db = require("./threads.json")
const { parse } = require('querystring')

const limiteTopicos = 10

let fioResposta = `
<div class="novo">
    <div class="conteudo">
        <h2>Responder</h2>
        <form action="/responder/" method="post">
            <input name="assunto" placeholder="Assunto" type="text">
            <textarea placeholder="Texto do seu fio" name="mensagem" cols="30" rows="10"></textarea>
        <button type="submit">Enviar resposta</button>
    </form>
    </div> 
</div>` 
const restoSite = `</div></main></body></html>`

const servidor = http.createServer((request,response)=>{
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html');
    let url = request.url;

    
    //console.log(request.param)
    if(request.method == "POST")
    {
        console.log("tentou post")
        let bode = ""

        request.on('data', (dado)=>{
            bode += dado.toString()
            
        })
        request.on('end', ()=>
        {
            resultado = parse(bode)
            
            if(url === '/')
            {
                novoFio(resultado.assunto,resultado.mensagem)
                response.writeHead(302,{
                    location: `http://${hostname}/fio/${db.fios.length}` 
                });
            }
            else if(url === "/responder/")
            {
                let numFio = request.headers.referer
                let referer = request.headers.referer

                numFio = Number(numFio.replace(`http://${hostname}/fio/`,"")) 

                novaResposta(numFio,resultado.assunto,resultado.mensagem)
                //console.log("tentando responder o fio: "+numFio)

                response.writeHead(302,{
                    location: referer
                });
            }
            
            response.end();
        })
    }
    else if(url === '/')
    {
        //home
        //console.log(tempoestampa)
        fs.readFile("catalogo.html", function(err, site){
            if(err)
            {
                response.writeHead(404, {'Content-Type': 'text/html'});
                return response.end("404 Not Found");
            }

            response.write(site+getOPs()+restoSite)
            return response.end();
        })
    }
    else if(url.startsWith("/fio/"))
    {
        let fio = Number(url.replace("/fio/","")) 
        fs.readFile("index.html", function(err, site){
            if(err)
            {
                response.writeHead(404, {'Content-Type': 'text/html'});
                return response.end("404 Not Found");
            }

            response.write(site+getFio(fio)+fioResposta+restoSite)
            return response.end();
        })
    }
    else
    {
        //404
        response.statusCode = 404;

        response.write("<h1>Pagina nao encontrada</h1>")
            
        return response.end();
    }
})
servidor.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);

});

/**
 * Função que retorna, em HTML, um fio completo com as respostas.
 * @param {Number} numero Numero do fio
 * @returns {HTMLElement} Divs dos OPs e respostas
 */
function getFio(numero)
{
    let fiojson = ""
    for (let index = 0; index < db.fios.length; index++) {
        if(db.fios[index].OP.numero == numero)
        {
            fiojson = db.fios[index]
        }
        
    }
    let op = `<div class="fio"><div class="op"><div class="conteudo"><p class="titulo">${fiojson.OP.titulo}</p><p>${ fiojson.OP.mensagem.includes(`\r\n`) ? fiojson.OP.mensagem.replace(/\r\n/g,"<br>") : fiojson.OP.mensagem}</p></div></div>`
    let respostas = ""
    for (let index = 0; index < fiojson.respostas.length; index++) {
        respostas+=`
        <div class="resposta"><div class="conteudo">
            <p class="titulo">${fiojson.respostas[index].titulo == ""? "Anonimo" : fiojson.respostas[index].titulo}</p>
            <p>${fiojson.respostas[index].mensagem}</p>
        </div>
    </div>`
    }

    return op+respostas
}
/**
 * Função que retorna, em HTML, todos os OPs e apenas os OPs.
 * @returns {HTMLElement} Divs dos OPs
 */
function getOPs()
{
    let fiosJson = db.fios
    let ops = ""
    for (let i = 0; i < fiosJson.length; i++) 
    {
        ops += `<div class="fio" onclick="window.location='${"/fio/"+fiosJson[i].OP.numero}'">
            
                <div class="conteudo">
                    <p class="titulo">${fiosJson[i].OP.titulo}</p>
                    <p>${fiosJson[i].OP.mensagem}</p>
                </div>
                <p class="quantidade">${fiosJson[i].respostas.length} respostas.  <a href="${fiosJson[i].OP.link}">ABRIR</a></p>
            </div>`
    }
    return ops;
}
/**
 * Criar um novo fio.
 * @param {String} titulo Assunto do fio; Caso "" o assunto é "Anonimo"
 * @param {String} comentario Mensagem que vai ser adicionada no fio.
 */
function novoFio(titulo,comentario)
{
    if(db.fios.length >= limiteTopicos)
    {
        db.fios.pop()
        for (let index = 0; index < db.fios.length; index++) {
            db.fios[index].OP.numero--
        }
    }
    db.fios.unshift({OP:{
        numero: db.fios.length+1,
        titulo: titulo == ""? "Anonimo" : (titulo.includes("<script>") ? titulo.replace(/<script>/g,"") : titulo),
        mensagem: comentario.includes("<script>") ? comentario.replace(/<script>/g,"") : comentario,
        link:`/fio/${db.fios.length+1}`
        // mensagem: removerXSS(comentario)// comentario.includes("<script>") ? comentario.replace(/<script>/g,"") : comentario
    },respostas:[]})
    fs.writeFile("threads.json",JSON.stringify(db),err =>{
        if(err) throw err
        console.log("Novo fio adicionado")
    })
}
/**
 * Criar uma nova resposta.
 * @param {Number} fio Numero do fio.
 * @param {String} title Assunto do fio; Caso "" o assunto é "Anonimo"
 * @param {String} comment Mensagem que vai ser adicionada na resposta
 */
function novaResposta(fio,title,comment)
{
    for (let index = 0; index < db.fios.length; index++) {
        if(db.fios[index].OP.numero == fio)
        {
            db.fios[index].respostas.push({titulo: title=="" ? "Anonimo" : title,mensagem:comment})
        }
    }
    
    fs.writeFile("threads.json",JSON.stringify(db),err =>{
        if(err) throw err
        console.log("Nova resposta adicionada")
    })
}

function tratarPOST(corpo)
{
    let assunto = String(corpo.substring(0,corpo.indexOf('&'))) ;
    assunto = assunto.replace("assunto=","");
    assunto = assunto.replace(/\+/g," ");

    let mensagem = String(corpo.substring(corpo.indexOf('&'),corpo.length)) ;
    mensagem = mensagem.replace("&mensagem=","");
    //mensagem = trocarTodos(mensagem,"+"," ")
    //mensagem = trocarTodos(mensagem,"%0\\D%0","\n")

    console.log("assunto: '"+assunto+"' mensagem: '"+mensagem+"'");
    return {a:assunto,m:mensagem};
}
/**
 * 
 * @param {String} letras 
 * @param {String} letrasPraTirar 
 * @param {String} letrasPraColocar 
 * @returns {String} Nova string com tudo que era pra tirar tirado
 */
function trocarTodos(letras,letrasPraTirar,letrasPraColocar)
{
    let s = ""
    while(letras.includes(letrasPraTirar))
    {
        s =+ letras.replace(letrasPraTirar,letrasPraColocar)
    }
    return s
}
/**
 * Tentativa de fazer um sanitizante
 * @param {String} texto 
 * @returns {String} Texto com <script> removido
 */
function removerXSS(texto)
{
    let textoLimpo = texto.includes("<script>") ? texto.replace(/<script>/g,"") : textoLimpo
    textoLimpo = texto.includes("</script>") ? texto.replace(/<\/script>/g,"") : textoLimpo
    
    return textoLimpo
}