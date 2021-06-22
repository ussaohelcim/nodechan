const http = require('http')

const hostname = "192.168.0.105"
const port = 80
const fs = require('fs')
const db = require("./threads.json")

let teste = `
<div class="op">
    <div class="imagem"></div>
    <div class="conteudo">
        <p>Anonimo</p>
        <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Delectus nam quo sequi, aspernatur nostrum vitae id amet illum quas quos tempore, facere quasi porro quia omnis minus cupiditate consectetur accusantium.</p>
    </div> 
</div>
`
let fioResposta = `
<div class="novo">
    <div class="conteudo">
        <h2>Responder</h2>
        <input placeholder="Assunto" type="text">
        <textarea placeholder="Texto da sua resposta" name="" id="" cols="30" rows="10"></textarea>
        <button type="submit">Enviar</button>
    </div> 
</div>` 
const restoSite = `</div></main></body></html>`

const servidor = http.createServer((request,response)=>{
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html');
    let url = request.url;
    
    //console.log(request.param)
    
    if(request.method == 'POST')
    {
        console.log("tentou um post")
    }
    if(url === '/')
    {
        //home
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
        fs.readFile("404.html", function(err, site){
            if(err)
            {
                response.writeHead(404, {'Content-Type': 'text/html'});
                return response.end("404 Not Found");
            }

            response.write(site)
            return response.end();
        })
    }
})
servidor.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(db.fios[0].OP)
    //novoFio("Salve","","Estou apenas tostando o pretiffy")
    //novaResposta(3,"","MITO")
});

function getFio(numero)
{
    let fiojson = db.fios[numero-1]
    let op = `<div class="fio"><div class="op"><div class="conteudo"><p class="titulo">${fiojson.OP.titulo}</p><p>${fiojson.OP.mensagem}</p></div></div>`
    let respostas = ""
    for (let index = 0; index < fiojson.respostas.length; index++) {
        respostas+=`<div class="resposta"><div class="conteudo">
            <p class="titulo">${fiojson.respostas[index].titulo == ""? "Anonimo" : fiojson.respostas[index].titulo}</p>
            <p>${fiojson.respostas[index].mensagem}</p>
        </div>
    </div>`
    }

    return op+respostas
}
function getOPs()
{
    let fiosJson = db.fios
    let ops = ""
    for (let i = 0; i < fiosJson.length; i++) 
    {
        ops += `<div class="fio" onclick="window.location='${"/fio/"+fiosJson[i].OP.numero}'">
                <div class="conteudo">
                    <p class="titulo">${fiosJson[i].OP.titulo}</p><p>${fiosJson[i].OP.mensagem}</p>
                </div>
                <p class="quantidade">${fiosJson[i].respostas.length} respostas.</p>
            </div>`
    }
    return ops;
}
function novoFio(titulo,comentario)
{
    db.fios.push({OP:{numero:db.fios.length+1,titulo:titulo,mensagem:comentario},respostas:[]})
    fs.writeFile("threads.json",JSON.stringify(db),err =>{
        if(err) throw err
        console.log("Novo fio adicionado")
    })
}
function novaResposta(fio,title,comment)
{
    db.fios[fio-1].respostas.push({titulo:title,mensagem:comment})
    fs.writeFile("threads.json",JSON.stringify(db),err =>{
        if(err) throw err
        console.log("Nova resposta adicionada")
    })
}