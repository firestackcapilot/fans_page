
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

const DESTINATION_WALLET = 'HomxATUuN1Zr4uBaBCKyV5imdqJ9ZRt7DeDNRRuzdvVN';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSubscribed(docSnap.data().subscribed);
        }
      }
    });
  }, []);

  const handleSignup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => alert('Signup successful'))
      .catch(error => alert(error.message));
  };

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => alert('Login successful'))
      .catch(error => alert(error.message));
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const requestTransaction = async (amount) => {
    try {
      const provider = window.solana;
      if (!provider || !provider.isPhantom) {
        alert('Phantom wallet not found');
        return;
      }
      const resp = await provider.connect();
      const fromPubkey = new PublicKey(resp.publicKey.toString());
      const transaction = await connection.requestAirdrop(fromPubkey, 0.01 * LAMPORTS_PER_SOL); // for devnet testing
      const blockhash = await connection.getLatestBlockhash();
      const ix = {
        keys: [
          { pubkey: fromPubkey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(DESTINATION_WALLET), isSigner: false, isWritable: true },
        ],
        programId: new PublicKey('11111111111111111111111111111111'), // system program
        data: Buffer.alloc(0),
      };
      console.log("Simulating payment of", amount, "SOL from", fromPubkey.toString());
      alert(`Simulated payment of ${amount} SOL`);
    } catch (e) {
      console.error(e);
      alert('Payment failed');
    }
  };

  const handleSubscribe = async () => {
    await requestTransaction(0.22);
    await setDoc(doc(db, 'users', user.uid), { subscribed: true });
    setSubscribed(true);
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">Solana Meetup</h1>
      {!user ? (
        <>
          <input
            className="border p-2 w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSignup}>Sign Up</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleLogin}>Log In</button>
        </>
      ) : (
        <>
          <p>Welcome, {user.email}</p>
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={handleLogout}>Log Out</button>
          {!subscribed ? (
            <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={handleSubscribe}>
              Subscribe - 0.22 SOL
            </button>
          ) : (
            <>
              <h2 className="font-semibold">Meetup Sessions</h2>
              <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={() => requestTransaction(0.2)}>
                Half Session - 0.2 SOL
              </button>
              <button className="bg-indigo-500 text-white px-4 py-2 rounded" onClick={() => requestTransaction(0.33)}>
                Full Session - 0.33 SOL
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
