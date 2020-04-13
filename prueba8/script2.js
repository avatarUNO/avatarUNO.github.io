let bot = new RiveScript();

const message_container = document.querySelector('.messages');
const form = document.querySelector('form');
const input_box = document.querySelector('input');

const brains = [
  'brain/brain.rive',
];

bot.loadFile(brains).then(botReady).catch(botNotReady);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  selfReply(input_box.value);
  input_box.value = '';
});

function botReply(message){
  message_container.innerHTML += `<div class="bot">${message}</div>`;
  //message_container.innerHTML += `<div id="dialogDiv">${message}</div>`; NO
  location.href = '#edge';
}

// ocultado "message_container..., porque en la opción boton, me aparece"
function selfReply(message){
//  message_container.innerHTML += `<div class="self">${message}</div>`;
//  location.href = '#edge';
  
  bot.reply("local-user", message).then(function(reply) {
    botReply(reply);
  });
}


//ESTA FUNCION SE ACTIVA CUANDO EL PROGRAMA A LEIDO LOS ARCHIVOS RIVE
function botReady(){
  bot.sortReplies();
 // botReply(); //puede decir parametros, como"hola", pero me queda mal y lo quitado
}

function botNotReady(err){
  console.log("An error has occurred.", err);
}