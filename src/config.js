export const GAME_CONFIG = {
    // Track settings
    TRACK: {
        WIDTH: 60,
        HEIGHT_OFFSET: 0.1,
        INNER_RADIUS: 120,
        SECTIONS: {
            STRAIGHT: { RADIUS_OFFSET: 60 },
            HAIRPIN: { RADIUS_OFFSET: 30 },
            S_CURVE: { RADIUS_OFFSET: 45 },
            GENTLE: { RADIUS_OFFSET: 40 },
            CHICANE: { RADIUS_OFFSET: 35 }
        },
        BARRIER_HEIGHT: 2,
        BARRIER_THICKNESS: 0.5,
        CONE_SPACING: 15,
        INITIAL_SCORE: 1000,
        SCORE_DECAY_RATE: 0.5, // Points per second
        CONE_PENALTY: 50
    },

    // Car settings
    CAR: {
        MAX_FORWARD_SPEED: 8,
        MAX_REVERSE_SPEED: 5,
        ACCELERATION: 0.05,
        DECELERATION: 0.98,
        TURN_SPEED: 0.03,
        MASS: 1500,
        WHEEL_RADIUS: 0.4,
        WHEEL_WIDTH: 0.3,
        WHEEL_MASS: 1,
        WHEEL_FRICTION: 0.3,
        WHEEL_ROLL_FRICTION: 0.1,
        WHEEL_SUSPENSION_STIFFNESS: 30,
        WHEEL_SUSPENSION_DAMPING: 4.3,
        WHEEL_FRICTION_SLIP: 1.3,
        WHEEL_ROLL_INFLUENCE: 0.01
    },

    // Camera settings
    CAMERA: {
        HEIGHT: 20,
        DISTANCE: 40,
        FOLLOW_SMOOTHING: 0.1
    },

    // Physics settings
    PHYSICS: {
        GRAVITY: -9.81,
        FIXED_TIME_STEP: 1 / 60
    },

    // Lighting settings
    LIGHTING: {
        AMBIENT_INTENSITY: 0.5,
        DIRECTIONAL_INTENSITY: 1,
        SHADOW_MAP_SIZE: 2048
    }
}; 