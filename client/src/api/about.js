// About component containing button and PopOver

import React, { useState } from 'react';
import { Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';

export const About = props => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const toggle = () => setPopoverOpen(!popoverOpen);

  return (
    <div>
      <Button id='about' type='button'>
        About
      </Button>
      <Popover
        placement='auto'
        trigger='legacy'
        isOpen={popoverOpen}
        target='about'
        toggle={toggle}
      >
        <PopoverHeader>About</PopoverHeader>
        <PopoverBody>
          housepricemap.ie was designed and built by Darren Greenfield. It uses official house sale
          data from the <a href='https://www.propertypriceregister.ie/'>Property Price Register</a>.
          Unfortunately, address data in the register is in a non-standard format and do not include
          Eircodes or coordinates, so you may find some wonky locations. Sorry about that!{' '}
          <div className='spacer' />
          You can read more about the owner of this site in his{' '}
          <a href='https://medium.com/@darren.g' target='_blank' rel='noopener noreferrer'>
            Medium blog posts
          </a>{' '}
          , check out his personal website at:
          <a href='https://darrengreenfield.com' target='_blank' rel='noopener noreferrer'>
            darrengreenfield.com
          </a>
          , or contact him at:{' '}
          <a href='mailto:darren.greenfield@gmail.com'>darren@darrengreenfield.com</a>
        </PopoverBody>
      </Popover>
    </div>
  );
};
