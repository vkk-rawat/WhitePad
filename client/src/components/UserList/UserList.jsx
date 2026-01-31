import './UserList.css';

const UserList = ({ users }) => {
    if (!users || users.length === 0) return null;

    return (
        <div className="user-list">
            <div className="user-list-header">
                <span className="user-count">{users.length}</span>
                <span>Online</span>
            </div>
            <div className="user-list-items">
                {users.map(user => (
                    <div key={user.id} className="user-item">
                        <span
                            className="user-avatar"
                            style={{ backgroundColor: user.cursorColor }}
                        >
                            {(user.name || 'A')[0].toUpperCase()}
                        </span>
                        <span className="user-name">{user.name || 'Anonymous'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserList;
