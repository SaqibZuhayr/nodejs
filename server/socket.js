module.exports = function(io){
    io.on('connection', socket =>{
        console.log("me agya");
        socket.on('refresh', data => {
            io.emit('refreshPage',{});
        })

    });
}