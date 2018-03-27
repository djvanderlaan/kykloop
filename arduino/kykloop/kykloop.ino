
#include <Servo.h>

// Set the pin, max and minimum angles for the pan
Servo serv_pan;
const int PIN_PAN = 12;
const int MIN_PAN = 20;
const int MAX_PAN = 160;

// Set the pin, max and minimum angles for the tilt
Servo serv_tilt;
const int PIN_TILT = 9;
const int MIN_TILT = 5;
const int MAX_TILT = 175;

// Inititalise servos and set initial position to 90 degrees
void setup() {
  serv_pan.attach(PIN_PAN);
  serv_tilt.attach(PIN_TILT);
  Serial.begin(9600);
  serv_pan.write(90);
  serv_tilt.write(90);
}

void set_tilt(int angle) {
  Serial.print("Setting tilt to: ");
  Serial.println(angle);
  if (angle < MIN_TILT) angle = MIN_TILT;
  if (angle > MAX_TILT) angle = MAX_TILT;
  serv_tilt.write(angle);
}

void set_pan(int angle) {
  Serial.print("Setting pan to: ");
  Serial.println(angle);
  if (angle < MIN_PAN) angle = MIN_PAN;
  if (angle > MAX_PAN) angle = MAX_PAN;
  serv_pan.write(angle);
}

// In the loop we will be reading data from serial input. Reading can be in 
// three possible states:
// RNO: we are waiting for input
// RPAN: we are reading the new position for the pan; the state swithes to 
//   this state when it finds a 'p' in the input. It finishes reading the 
//   pan and sets the pan when a ';' is found.
// RTILT: we are reading the new position for the tilt; the state swithes to 
//   this state when it finds a 't' in the input. It finishes reading the 
//   tilt and sets the tilt when a ';' is found.
//
const int RNO   = 0;
const int RPAN  = 1;
const int RTILT = 2;

void loop() {
  static int read_num = RNO;
  static int value = 0;
  
  if (Serial.available()) {
    char ch = Serial.read();

    if (ch == 'p') {
      read_num = RPAN;      
    } else if (ch == 't') {
      read_num = RTILT;
    } else if (read_num != RNO) {
      if (ch >= '0' && ch <= '9') {
        value = value*10 + (ch - '0');
      } else if (ch == ';') {
        if (read_num == RPAN) set_pan(value);
        else if (read_num = RTILT) set_tilt(value);
        value = 0;  
      } else {
        Serial.print("Error: invalid character in value mode: ");
        Serial.println(ch);
      }
    } else {
      Serial.print("Error: invalid character: ");
      Serial.println(ch);
    }
  }
}

