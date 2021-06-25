import React, { useState } from 'react';

const Popup = (props) => {
  const [toggle, setToggle] = useState(false);

  const togglePopup = () => setToggle((prevToggle) => !prevToggle);
  return (
    <>
      <input type="button" value="Edit" onClick={togglePopup} />
      {toggle && (
        <div className="popup-box">
          <div className="box">
            <span className="close-icon" onClick={togglePopup }>
              x
            </span>
            {props.content}
          </div>
        </div>
      )}
    </>
  );
};

export default Popup;