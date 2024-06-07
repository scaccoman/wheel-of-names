import React, { useState } from 'react'
import { Wheel } from 'react-custom-roulette';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import ConfettiExplosion from 'react-confetti-explosion';

// @ts-ignore
import spinWheelMp3 from './spin-wheel.mp3';
// @ts-ignore
import crowdCheeringMp3 from './crowd-cheering.mp3';
// @ts-ignore
import copyMeMp3 from './copy-me.mp3';
// @ts-ignore
import congratulationsMp3 from './congratulations-deep-voice.mp3';
import { useAudio } from './audio';

const lineWidth = 6;
const lineColor = 'white';

const namesParamName = 'names';

const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

interface Props {
  names: string[];
  lockWheel: boolean;
  setLockWheel: React.Dispatch<React.SetStateAction<boolean>>;
  data: any;
  mute: boolean;
}

const WheelComponent = ({ names, lockWheel, setLockWheel, data, mute }: Props) => {
  const [isWheelAudioPlaying, toggleWheelAudio] = useAudio(spinWheelMp3);
  const [isCrowdAudioPlaying, toggleCrowdAudio] = useAudio(crowdCheeringMp3);
  const [isCopyMeAudioPlaying, toggleCopyMeAudio] = useAudio(copyMeMp3);
  const [isCongratulationsAudioPlaying, toggleCongratulationsAudio] = useAudio(congratulationsMp3);

  const [showModal, setShowModal] = useState(false);
  const [confettiColors, setConfettiColors] = useState<string[]>([]);
  const [winnerStyle, setWinnerStyle] = useState({});
  const [copied, setCopied] = useState(false);
  const [isExploding, setIsExploding] = React.useState(false);

  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState('');
  const [winnerText, setWinnerText] = useState('');

  const params = new URLSearchParams(location.search)

  const handleSpinClick = () => {
    if (!mustSpin && !lockWheel) {
        !mute && toggleWheelAudio();
        const newPrizeNumber = Math.floor(Math.random() * data.length);
        setPrizeNumber(newPrizeNumber);
        setMustSpin(true);
        setLockWheel(true);
    }
  }

  const handleStopSpinning = () => {
    setMustSpin(false);
    const winner = data[prizeNumber];
    const winnerName = capitalizeFirstLetter(winner.option)
    const winnerBackgroundColor = winner.style.backgroundColor;
    const winnerTextColor = winner.style.textColor;

    params.set(namesParamName, names.filter(name => name.toLocaleLowerCase() !== winnerName.toLocaleLowerCase()).join(','))

    setWinner(winnerName);
    setWinnerText(`@${winnerName} will be the next host!\nNew wheel: ${location.protocol}//${location.host}${location.pathname}?${params.toString()}`);
    setConfettiColors([winnerBackgroundColor, winnerTextColor]);
    setWinnerStyle({ backgroundColor: winnerBackgroundColor, color: winnerText })

    setIsExploding(true);
    isWheelAudioPlaying && !mute && toggleWheelAudio()
    !isCrowdAudioPlaying && !mute && toggleCrowdAudio()

    setTimeout(() => {
        setShowModal(true)
        setLockWheel(false)
    }, 2000)

    setTimeout(() => !isCopyMeAudioPlaying && !mute && toggleCopyMeAudio(), 5000)
  }

  const handleCloseModal = () => {
    setShowModal(false);
    setIsExploding(false);
    history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  const handleCopyClick = () => {
    navigator.clipboard.writeText(winnerText);
    setCopied(true);
    isCopyMeAudioPlaying && !mute && toggleCopyMeAudio()
    !isCongratulationsAudioPlaying && !mute && toggleCongratulationsAudio();
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