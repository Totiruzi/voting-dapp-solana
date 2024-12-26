import * as anchor from "@coral-xyz/anchor";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voting } from "../target/types/voting";
import { buffer } from "stream/consumers";

const IDL = require("../target/idl/voting.json");
const votingAddress = new PublicKey(
  "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF"
);

describe("voting", () => {
  let context;
  let provider;
  let votingProgram: any;

  beforeAll(async () =>{
    context = await startAnchor(
      "",
      [{ name: "voting", programId: votingAddress }],
      []
    );
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(IDL, provider);
  })

  // Configure the client to use the local cluster.
  it("Initialize Poll", async() => {
    // const votingKeypair = Keypair.generate();

    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        "What is your favorite sandwish?",
        new anchor.BN(0),
        new anchor.BN(1835048538)
      )
      .rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log("{}",poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favorite sandwish?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("Initialize Candidate", async () => {
    await votingProgram.methods.initializeCandidate(
      "Struchy Eggs",
      new anchor.BN(1),
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "Fish spread",
      new anchor.BN(1),
    ).rpc();

    const [struchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Struchy Eggs")],
      votingAddress,
    );

    const struchyCandidate = await votingProgram.account.candidate.fetch(struchyAddress);

    const [fishSpreedAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Fish spread")],
      votingAddress,
    );

    const fishSpreedCandidate = await votingProgram.account.candidate.fetch(fishSpreedAddress);

    console.log(struchyCandidate);
    console.log(fishSpreedCandidate);

    expect(struchyCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(fishSpreedCandidate.candidateVotes.toNumber()).toEqual(0);

  })
  
  it("Votes", async () => {
    await votingProgram.methods.vote(
      "Fish spread",
      new anchor.BN(1),
    ).rpc();

    const [fishSpreedAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Fish spread")],
      votingAddress,
    )

    const fishSpreedCandidate = await votingProgram.account.candidate.fetch(fishSpreedAddress);
    console.log(fishSpreedCandidate);

    expect(fishSpreedCandidate.candidateVotes.toNumber()).toBe(1);
  })


});
