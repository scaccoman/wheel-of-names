import React, { useState } from 'react'
import { Wheel } from 'react-custom-roulette';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import ConfettiExplosion from 'react-confetti-explosion';

// @ts-ignore
import spinWheelMp3 from '../../../public/spin-wheel.mp3';
// @ts-ignore
import copyMeWav from '../../../public/copy-me.wav';
// @ts-ignore
import congratulationsMp3 from '../../../public/congratulations-deep-voice.mp3';

const lineWidth = 6;
const lineColor = 'white';
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

const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const useAudio = (url: string): any => {
    const [audio] = useState(new Audio(url));
    const [playing, setPlaying] = useState(false);
  
    const toggle = () => setPlaying(!playing);
  
    React.useEffect(() => {
        playing ? audio.play() : audio.pause();
      },
      [playing]
    );
  
    React.useEffect(() => {
      audio.addEventListener('ended', () => setPlaying(false));
      return () => {
        audio.removeEventListener('ended', () => setPlaying(false));
      };
    }, []);
  
    return [playing, toggle];
  };


const getData = (names: string[], unfairMode: boolean) => names.map((name, index) => ({
    option: name,
    style: randomStyles[index] || randomStyles[Math.floor(Math.random() * randomStyles.length)],
    optionSize: unfairMode ? Math.floor(Math.random() * 100) : 1
}))

const WheelComponent = () => {
  const [isWheelAudioPlaying, toggleWheelAudio] = useAudio(spinWheelMp3);
  const [isCopyMeAudioPlaying, toggleCopyMeAudio] = useAudio(copyMeWav);
  const [isCongratulationsAudioPlaying, toggleCongratulationsAudio] = useAudio(congratulationsMp3);

  const [showModal, setShowModal] = useState(false);
  const [confettiColors, setConfettiColors] = useState<string[]>([]);
  const [winnerStyle, setWinnerStyle] = useState({});
  const [copied, setCopied] = useState(false);
  const [isExploding, setIsExploding] = React.useState(false);

  const [mustSpin, setMustSpin] = useState(false);
  const [lockWheel, setLockWheel] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState('');
  const [winnerText, setWinnerText] = useState('');

  const params = new URLSearchParams(location.search)
  const names = params.get(namesParamName)?.split(',');
  const unfairMode = Boolean(params.get(unfairModeName));

  if (!names || !names.length) {
    return <h2>Please provide names via query string params, example: ?names=john,mario,willy,frank</h2>
  }

  const [data, setData] = useState<any[]>(getData(names, unfairMode));

  React.useCallback(() => {
    setData(names.map((name, index) => ({
        option: name,
        style: randomStyles[index] || randomStyles[Math.floor(Math.random() * randomStyles.length)],
        optionSize: unfairMode ? Math.floor(Math.random() * 100) : 1
      })))
  }, [names, unfairMode])

  const handleSpinClick = () => {
    if (!mustSpin && !lockWheel) {
        toggleWheelAudio();
        const newPrizeNumber = Math.floor(Math.random() * data.length);
        setPrizeNumber(newPrizeNumber);
        setMustSpin(true);
    }
  }

  const handleStopSpinning = () => {
    setLockWheel(true);
    setMustSpin(false);
    const winner = data[prizeNumber];
    const winnerName = capitalizeFirstLetter(winner.option)
    const winnerBackgroundColor = winner.style.backgroundColor;
    const winnerTextColor = winner.style.textColor;
    params.set(namesParamName, names.filter(name => name !== winnerName).join(','));

    setWinner(winnerName);
    setWinnerText(`${winnerName} will be tomorrow's host!\nNew wheel: ${location.protocol}//${location.host}${location.pathname}?${params.toString()}`);
    setConfettiColors([winnerBackgroundColor, winnerTextColor]);
    setWinnerStyle({ backgroundColor: winnerBackgroundColor, color: winnerText })

    setIsExploding(true);
    setTimeout(() => {
        setShowModal(true)
        setLockWheel(false)
        isWheelAudioPlaying && toggleWheelAudio()
    }, 2000)

    setTimeout(() => !isCopyMeAudioPlaying && toggleCopyMeAudio(), 3000)
  }

  const handleCloseModal = () => {
    setShowModal(false);
    setIsExploding(false);
    history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  const handleCopyClick = () => {
    navigator.clipboard.writeText(winnerText);
    setCopied(true);
    isCopyMeAudioPlaying && toggleCopyMeAudio()
    !isCongratulationsAudioPlaying && toggleCongratulationsAudio();
  };

  return (
    <div>
        <div className='big-wheel' onClick={handleSpinClick}>
            <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={data}
                onStopSpinning={handleStopSpinning}
                outerBorderColor={lineColor}
                outerBorderWidth={lineWidth}
                innerBorderColor={lineColor}
                innerBorderWidth={lineWidth}
                radiusLineColor={lineColor}
                radiusLineWidth={lineWidth}
                spinDuration={1.3}
            />
        </div>
        <button className={'spin-button'} onClick={handleSpinClick}>
            SPIN
        </button>
        {isExploding && <div className="confetti">
            <ConfettiExplosion 
            onComplete={() => setIsExploding(false)} 
            duration={5000} 
            particleSize={12} 
            particleCount={200} 
            force={1}
            width={4000}
            zIndex={9999}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            // colors={confettiColors}
        />
        </div>}
        {showModal && (
            <Modal animationDuration={500} open={showModal} onClose={handleCloseModal} showCloseIcon={false} center>
                <h2 id="modal-title">Congratulations!</h2>
                <div id="modal-description" onClick={handleCopyClick}>
                    <p><span className='winner-name' style={winnerStyle}>{winner}</span> is the winner!</p>
                    <p className='copy-button'>{copied ? 'Copied!' : 'Copy Me'}</p>
                </div>
            </Modal>
      )}
    </div>
  )
}

export default WheelComponent;