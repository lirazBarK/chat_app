
const usersContainerTpl = `
 <div id="chat-users" class="col-md-3">
    <div class="well">
        <h3>Online Users</h3>
        <ul class="list-group" id="users">

         </ul>
    </div>
</div>
`;
const msgContainerTpl = `
<div class="col-md-7">
    <div id="msg-container"></div>
    <div id="submit">
        <label>Enter Message</label>
        <textarea class="form-control" id="message"></textarea>
        <button>Send</button>
    </div>
</div>`;

const roomContainerTpl = ` <div id="roomsContainer" class="col-md-2">
<div class="well">
    <h4>Chat Rooms</h4>
    <ul class="list-group" id="rooms">


    </ul>
</div>
</div>`;


let $container = '';
//$submitBtn;


class Chat {
    constructor(container, username, socket) {
        this.username = username;
        this.socket = socket;
        $container = $(container);
        $container.append(usersContainerTpl);
        $container.append(msgContainerTpl);
        $container.append(roomContainerTpl);
    }

    submitUser() {
        this.socket.emit('join', this.username, rooms => {
            const $rooms = $container.find('#rooms');
            if (rooms && rooms.length) {
                // draw rooms list
                rooms.forEach(room => {
                    const $li = $('<li>');
                    $li.id = room;
                    $li.html(room);
                    $li.addClass('room');
                    $rooms.append($li);
                });

                // join first room
                this.switchRoom(rooms[0]);

            } else {
                console.error('failed to join', username);
            }
            $rooms.on('click', (e) => {
                this.switchRoom(e.target.innerHTML);
            });
        });
    }


    switchRoom(room) {
        this.socket.emit('switchRoom', room, (history) => {
            const $chat = $container.find('#msg-container');
            const $rooms = $container.find('#rooms');

            console.log('switched room', room);
            $chat.empty();
            $rooms.find('li').each((i, li) => $(li).toggleClass('active', li.innerHTML === room));

            // draw room history

            history.forEach(this.addMsg);

        });
        this.socket.on('room_users', this.addUsers);

    }

    init() {
        const $submitBtn = $container.find('#submit button');
        const msg = $container.find('#message');

        $submitBtn.on('click', (e) => {
            this.onSubmit(msg.val());
            msg.val('');
        });
    
        this.socket.on('message', this.addMsg);
    }

    addMsg(message) {
        const $div = $('<div>');
        $div.addClass('well');
        if (message.user) {
            $div.append(`<span>${message.user}: </span>`);
        }
        $div.append(`<span>${message.msg}</span>`);
        $container.find('#msg-container').append($div);
    }

    onSubmit(msg) {
        this.socket.emit('message', msg);
    }

    addUsers(users) {
        const $usersList = $container.find('#users');
        $usersList.empty();
        users.forEach(user => {
            const $li = $('<li>');
            $li.html(user);
            $usersList.append($li);
            
        });
    }

}

