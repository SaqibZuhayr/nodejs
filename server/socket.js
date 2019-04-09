module.exports = function (io) {
    io.on('connection', socket => {
        socket.on('refresh', data => {
            io.emit('refreshPage', {});
        });

        socket.on('start_typing', data => {
            console.log(data);
            io.emit('is_typing',data)
        });

        socket.on('stop_typing', data => {
            console.log(data);
            io.emit('has_stop',data)
        });
    });
}