
const signInTpl = `<div id="userFormArea" class="row col-md-12">
<div class="col-md-12">
    <form id="userForm">
        <div class="form-group">
            <label>Enter Username</label>
            <input type="text" class="form-control" id="username" />
            <br />
            <input type="submit" class="btn btn-primary" value="Login" />
        </div>
    </form>
</div>
</div>`

const socket = io.connect();

class SignIn {
    constructor() {

    }

    init(container) {
        const $container = $(container);
        $container.append(signInTpl);
        const $userForm = $container.find('#userForm');
        $userForm.submit(e => {
            e.preventDefault();
            $('#sign-in-container').hide();
            const username = $container.find('#username').val();
            const chat = new Chat($('#chat-container'),username,socket);
            chat.init();
            chat.submitUser();
        });
    }
}


