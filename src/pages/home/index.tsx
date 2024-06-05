import React from 'react'
import classNames from 'classnames'

import { CLASS_NAME } from './const'
import { type HomeProps } from './types'
import { propTypes, defaultProps } from './props'

import './style.scss'
import Wheel from './wheel'

// @ts-ignore
import buttonClickMp3 from './button-click.mp3';
import { useAudio } from './audio'

const namesParamName = 'names';
const unfairModeName = 'unfairMode';

const randomStyles = [
    { backgroundColor: '#FFD1DC', textColor: '#505050' },
    { backgroundColor: '#FFEF96', textColor: '#000033' },
    { backgroundColor: '#B0E57C', textColor: '#228B22' },
    { backgroundColor: '#AEC6CF', textColor: '#483D8B' },
    { backgroundColor: '#C3B1E1', textColor: '#4B0082' },
    { backgroundColor: '#F0E68C', textColor: '#556B2F' },
    { backgroundColor: '#F5DEB3', textColor: '#696969' },
    { backgroundColor: '#FFDAB9', textColor: '#003333' },
];

const getData = (names: string[], unfairMode: boolean) => names.map((name, index) => ({
  option: name,
  style: randomStyles[index] || randomStyles[Math.floor(Math.random() * randomStyles.length)],
  optionSize: unfairMode ? Math.floor(Math.random() * 100) : 1
}))

const Home: React.FC<HomeProps> = (props: HomeProps) => {
  const { className } = props
  const finalClassName = classNames(CLASS_NAME, className);
  const params = new URLSearchParams(window.location.search);
  const initialNames = params.get(namesParamName)?.split(',');

  const [buttonClick, toggleButtonClick] = useAudio(buttonClickMp3);
  const [mute, setMute] = React.useState(false);
  const [unfairMode, setUnfairMode] = React.useState(Boolean(params.get(unfairModeName)));
  const [names, setNamesState] = React.useState(initialNames || []);
  const [lockWheel, setLockWheel] = React.useState(false);

  const [data, setData] = React.useState<any[]>(getData(names, unfairMode));
  

  React.useEffect(() => {
    if (!names.length) {
      window.history.replaceState({}, '', `${window.location.pathname}?names=john,mario,willy,frank,anna,joe`);
      window.location.reload();
    }
  }, [names]);

  const handleTextareaChange = (event: any) => {
    const newNames = event.target.value.split('\n');
    setNamesState(newNames);
  };

  const handleUnfairMode = (event: any) => {
    if (lockWheel) return;

    toggleButtonClick();
    setUnfairMode(!unfairMode);
  }

  const handleKeyPress = React.useCallback((event: any) => {
    if (event.key === 'm') {
      handleMute();
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress, false);

    return () => {
      document.removeEventListener('keydown', handleKeyPress, false);
    };
  }, [handleKeyPress]);

  const handleMute = () => {
    if (lockWheel) return;

    setMute(!mute);
  }

  React.useEffect(() => {
    window.history.replaceState({}, '', `${window.location.pathname}?names=${names.join(',')}${unfairMode ? '&unfairMode=true' : ''}`);
    setData(names.filter(Boolean).map((name, index) => ({
        option: name,
        style: randomStyles[index] || randomStyles[Math.floor(Math.random() * randomStyles.length)],
        optionSize: unfairMode ? Math.floor(Math.random() * 100) : 1
      })))
  }, [names, unfairMode])

  if (!names.length) {
    return <h2>Please provide names via query string params, example: ?names=john,mario,willy,frank,anna,joe</h2>;
  }

  return (
    <div className={finalClassName}>
      <div className={`${CLASS_NAME}-content-wrapper`}>
        <h1>{unfairMode ? 'Unfair ' : ''}Wheel of Names</h1>
        <div className={`${CLASS_NAME}-wheel-wrapper`}>
          <Wheel names={names} lockWheel={lockWheel} setLockWheel={setLockWheel} data={data} mute={mute} />
          <div className="text-box">
            <div id="name-box-title">Names</div>
            <textarea 
              value={names.join('\n')}
              onChange={handleTextareaChange}
              disabled={lockWheel}
            />
            <div id="unfair-mode-button" onClick={handleUnfairMode}>
                {unfairMode ? 'Disable Unfair Mode' : 'Enable Unfair Mode'}
            </div>
            {/* <div id="mute-button" onClick={handleMute}>
                {mute ? 'Enable sound' : 'Disable Sound'}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

Home.propTypes = propTypes
Home.defaultProps = defaultProps

export default Home
export { CLASS_NAME, type HomeProps }
