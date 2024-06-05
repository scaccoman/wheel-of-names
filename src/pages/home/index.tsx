import React from 'react'
import classNames from 'classnames'

import { CLASS_NAME } from './const'
import { type HomeProps } from './types'
import { propTypes, defaultProps } from './props'

import './style.scss'
import Wheel from './wheel'

const namesParamName = 'names';

const Home: React.FC<HomeProps> = (props: HomeProps) => {
  const { className } = props
  const finalClassName = classNames(CLASS_NAME, className);
  const params = new URLSearchParams(window.location.search);
  const initialNames = params.get(namesParamName)?.split(',');

  const [names, setNamesState] = React.useState(initialNames || []);
  const [lockWheel, setLockWheel] = React.useState(false);

  React.useEffect(() => {
    if (!names.length) {
      window.history.replaceState({}, '', `${window.location.pathname}?names=john,mario,willy,frank,anna,joe`);
      window.location.reload();
    }
  }, [names]);

  const handleTextareaChange = (event: any) => {
    const newNames = event.target.value.split('\n');
    params.set(namesParamName, newNames.join(','));
    window.history.replaceState({}, '', `${window.location.pathname}?names=${newNames.join(',')}`);
    setNamesState(newNames);
  };

  if (!names.length) {
    return <h2>Please provide names via query string params, example: ?names=john,mario,willy,frank,anna,joe</h2>;
  }

  return (
    <div className={finalClassName}>
      <div className={`${CLASS_NAME}-content-wrapper`}>
        <h1>Wheel of Names</h1>
        <div className={`${CLASS_NAME}-wheel-wrapper`}>
          <Wheel names={names} lockWheel={lockWheel} setLockWheel={setLockWheel} />
          <div className="text-box">
            <div id="name-box-title">Names</div>
            <textarea 
              value={names.join('\n')}
              onChange={handleTextareaChange}
              disabled={lockWheel}
            />
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
