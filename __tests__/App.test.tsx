/**
 * @format
 *
 * Smoke test for the pure config/API layer. The full App renders the Twilio Voice
 * native module, which isn't available under Jest without a device/native mock, so we
 * keep the unit test to the framework-free pieces. (Run the app on a simulator/device
 * to exercise the call itself.)
 */
import {DEFAULT_MODEL, CALL_MODE, BACKEND_URL} from '../src/config';

test('config is sane', () => {
  expect(typeof DEFAULT_MODEL).toBe('string');
  expect(DEFAULT_MODEL.length).toBeGreaterThan(0);
  expect(CALL_MODE).toBe('sanas');
  expect(BACKEND_URL.startsWith('https://')).toBe(true);
});
