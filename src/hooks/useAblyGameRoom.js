// // // // src/hooks/useAblyGameRoom.js
// src/hooks/useAblyGameRoom.js
import { useEffect } from "react";
import Ably from "ably";
import { useDispatch } from "react-redux";
import {
  roundUpdated,
  roundResultReceived,
  betResultReceived,
  jackpotUpdated,
} from "../features/roundSlice";

const useAblyGameRoom = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // console.log("Initializing Ably Realtime connection...");
    // IMPORTANT: In production, use token-based authentication.
    const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
    const channel = ably.channels.get("game-room");

    channel.subscribe("roundUpdate", (msg) => {
      // console.log("Received roundUpdate event:", msg.data);
      dispatch(roundUpdated(msg.data));
    });
    channel.subscribe("roundResult", (msg) => {
      // console.log("Received roundResult event:", msg.data);
      dispatch(roundResultReceived(msg.data));
    });
    channel.subscribe("betResult", (msg) => {
      // console.log("Received betResult event:", msg.data);
      dispatch(betResultReceived(msg.data));
    });
    channel.subscribe("individualBetUpdate", (msg) => {
      // console.log("Received individualBetUpdate event:", msg.data);
      dispatch(betResultReceived(msg.data));
    });
  
    channel.subscribe("jackpotUpdate", (msg) => {
      // console.log("Received jackpotUpdate event:", msg.data);
      dispatch(jackpotUpdated(msg.data));
    });

    return () => {
      // console.log("Cleaning up Ably connection...");
      channel.unsubscribe();
      ably.close();
    };
  }, [dispatch]);
};

export default useAblyGameRoom;



// // src/hooks/useAblyGameRoom.js
// import { useEffect } from "react";
// import Ably from "ably";
// import { useDispatch } from "react-redux";
// import {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } from "../features/roundSlice";

// const useAblyGameRoom = () => {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     console.log("Initializing Ably Realtime connection...");
//     // IMPORTANT: In production, use token-based authentication.
//     const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
//     const channel = ably.channels.get("game-room");

//     channel.subscribe("roundUpdate", (msg) => {
//       console.log("Received roundUpdate event:", msg.data);
//       dispatch(roundUpdated(msg.data));
//     });
//     channel.subscribe("roundResult", (msg) => {
//       console.log("Received roundResult event:", msg.data);
//       dispatch(roundResultReceived(msg.data));
//     });
//     channel.subscribe("betResult", (msg) => {
//       console.log("Received betResult event:", msg.data);
//       dispatch(betResultReceived(msg.data));
//     });
//     channel.subscribe("individualBetUpdate", (msg) => {
//       console.log("Received individualBetUpdate event:", msg.data);
//       // You can choose to dispatch a separate action or reuse betResultReceived.
//       dispatch(betResultReceived(msg.data));
//     });
//     channel.subscribe("aggregatedBetResults", (msg) => {
//       console.log("Received aggregatedBetResults event:", msg.data);
//       dispatch(aggregatedBetResultsReceived(msg.data));
//     });
//     channel.subscribe("participantResults", (msg) => {
//       console.log("Received participantResults event:", msg.data);
//       dispatch(participantResultsReceived(msg.data));
//     });
//     channel.subscribe("jackpotUpdate", (msg) => {
//       console.log("Received jackpotUpdate event:", msg.data);
//       dispatch(jackpotUpdated(msg.data));
//     });

//     return () => {
//       console.log("Cleaning up Ably connection...");
//       channel.unsubscribe();
//       ably.close();
//     };
//   }, [dispatch]);
// };

// export default useAblyGameRoom;

// // src/hooks/useAblyGameRoom.js
// import { useEffect } from "react";
// import Ably from "ably";
// import { useDispatch } from "react-redux";
// import {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } from "../features/roundSlice";

// const useAblyGameRoom = () => {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     console.log("Initializing Ably Realtime connection...");
//     // IMPORTANT: In production, use token-based authentication.
//     const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
//     const channel = ably.channels.get("game-room");

//     channel.subscribe("roundUpdate", (msg) => {
//       console.log("Received roundUpdate event:", msg.data);
//       dispatch(roundUpdated(msg.data));
//     });
//     channel.subscribe("roundResult", (msg) => {
//       console.log("Received roundResult event:", msg.data);
//       dispatch(roundResultReceived(msg.data));
//     });
//     channel.subscribe("betResult", (msg) => {
//       console.log("Received betResult event:", msg.data);
//       dispatch(betResultReceived(msg.data));
//     });
//     channel.subscribe("aggregatedBetResults", (msg) => {
//       console.log("Received aggregatedBetResults event:", msg.data);
//       dispatch(aggregatedBetResultsReceived(msg.data));
//     });
//     channel.subscribe("participantResults", (msg) => {
//       console.log("Received participantResults event:", msg.data);
//       dispatch(participantResultsReceived(msg.data));
//     });
//     channel.subscribe("jackpotUpdate", (msg) => {
//       console.log("Received jackpotUpdate event:", msg.data);
//       dispatch(jackpotUpdated(msg.data));
//     });

//     return () => {
//       console.log("Cleaning up Ably connection...");
//       channel.unsubscribe();
//       ably.close();
//     };
//   }, [dispatch]);
// };

// export default useAblyGameRoom;

// import { useEffect } from "react";
// import Ably from "ably";
// import { useDispatch } from "react-redux";
// import {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } from "../features/roundSlice";

// const useAblyGameRoom = () => {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     console.log("Initializing Ably Realtime connection...");
//     // IMPORTANT: In production, use token-based authentication.
//     const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
//     const channel = ably.channels.get("game-room");

//     channel.subscribe("roundUpdate", (msg) => {
//       console.log("Received roundUpdate event:", msg.data);
//       dispatch(roundUpdated(msg.data));
//     });
//     channel.subscribe("roundResult", (msg) => {
//       console.log("Received roundResult event:", msg.data);
//       dispatch(roundResultReceived(msg.data));
//     });
//     channel.subscribe("betResult", (msg) => {
//       console.log("Received betResult event:", msg.data);
//       dispatch(betResultReceived(msg.data));
//     });
//     channel.subscribe("aggregatedBetResults", (msg) => {
//       console.log("Received aggregatedBetResults event:", msg.data);
//       dispatch(aggregatedBetResultsReceived(msg.data));
//     });
//     channel.subscribe("participantResults", (msg) => {
//       console.log("Received participantResults event:", msg.data);
//       dispatch(participantResultsReceived(msg.data));
//     });
//     channel.subscribe("jackpotUpdate", (msg) => {
//       console.log("Received jackpotUpdate event:", msg.data);
//       dispatch(jackpotUpdated(msg.data));
//     });

//     return () => {
//       console.log("Cleaning up Ably connection...");
//       channel.unsubscribe();
//       ably.close();
//     };
//   }, [dispatch]);
// };

// export default useAblyGameRoom;
