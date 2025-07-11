import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHEVoting, FHEVoting__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHEVoting")) as FHEVoting__factory;
  const fheVotingContract = (await factory.deploy()) as FHEVoting;
  const fheVotingContractAddress = await fheVotingContract.getAddress();

  return { fheVotingContract, fheVotingContractAddress };
}

describe("FHEVoting", function () {
  let signers: Signers;
  let fheVotingContract: FHEVoting;
  let fheVotingContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async () => {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }
    ({ fheVotingContract, fheVotingContractAddress } = await deployFixture());
  });

  it("should initialize with zero votes for all options", async function () {
    for (let i = 0; i < 3; i++) {
      const voteCount = await fheVotingContract.getVoteCount(i);
      expect(voteCount).to.eq(ethers.ZeroHash);
    }
  });

  it("should allow a user to vote for option 0", async function () {
    // Check that user hasn't voted yet
    const hasVoted = await fheVotingContract.hasVoted(signers.alice.address);
    expect(hasVoted).to.be.false;

    // Encrypt vote value 1 for option 0
    const clearVote = 1;
    const encryptedVote = await fhevm
      .createEncryptedInput(fheVotingContractAddress, signers.alice.address)
      .add32(clearVote)
      .encrypt();

    // Vote for option 0
    const tx = await fheVotingContract
      .connect(signers.alice)
      .vote(0, encryptedVote.handles[0], encryptedVote.inputProof);
    await tx.wait();

    // Check that user has voted
    const hasVotedAfter = await fheVotingContract.hasVoted(signers.alice.address);
    expect(hasVotedAfter).to.be.true;

    // Get the encrypted vote count for option 0
    const encryptedVoteCount = await fheVotingContract.getVoteCount(0);

    // Decrypt the vote count
    const clearVoteCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedVoteCount,
      fheVotingContractAddress,
      signers.alice,
    );

    expect(clearVoteCount).to.eq(1);
  });

  it("should prevent double voting", async function () {
    // First vote
    const clearVote = 1;
    const encryptedVote = await fhevm
      .createEncryptedInput(fheVotingContractAddress, signers.alice.address)
      .add32(clearVote)
      .encrypt();

    const tx1 = await fheVotingContract
      .connect(signers.alice)
      .vote(0, encryptedVote.handles[0], encryptedVote.inputProof);
    await tx1.wait();

    // Try to vote again - should fail
    await expect(
      fheVotingContract.connect(signers.alice).vote(1, encryptedVote.handles[0], encryptedVote.inputProof),
    ).to.be.revertedWith("Already voted");
  });

  it("should allow multiple users to vote for different options", async function () {
    // Alice votes for option 0
    const clearVote = 1;
    const encryptedVoteAlice = await fhevm
      .createEncryptedInput(fheVotingContractAddress, signers.alice.address)
      .add32(clearVote)
      .encrypt();

    await fheVotingContract
      .connect(signers.alice)
      .vote(0, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);

    // Bob votes for option 1
    const encryptedVoteBob = await fhevm
      .createEncryptedInput(fheVotingContractAddress, signers.bob.address)
      .add32(clearVote)
      .encrypt();

    const tx2 = await fheVotingContract
      .connect(signers.bob)
      .vote(1, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);
    await tx2.wait();

    // Charlie votes for option 2
    const encryptedVoteCharlie = await fhevm
      .createEncryptedInput(fheVotingContractAddress, signers.charlie.address)
      .add32(clearVote)
      .encrypt();

    const tx3 = await fheVotingContract
      .connect(signers.charlie)
      .vote(2, encryptedVoteCharlie.handles[0], encryptedVoteCharlie.inputProof);
    await tx3.wait();

    // Check vote counts
    const voteCount0 = await fheVotingContract.getVoteCount(0);
    const voteCount1 = await fheVotingContract.getVoteCount(1);
    const voteCount2 = await fheVotingContract.getVoteCount(2);

    const clearVoteCount0 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      voteCount0,
      fheVotingContractAddress,
      signers.alice,
    );

    const clearVoteCount1 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      voteCount1,
      fheVotingContractAddress,
      signers.bob,
    );

    const clearVoteCount2 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      voteCount2,
      fheVotingContractAddress,
      signers.charlie,
    );

    expect(clearVoteCount0).to.eq(1);
    expect(clearVoteCount1).to.eq(1);
    expect(clearVoteCount2).to.eq(1);
  });

  it("should reject invalid option numbers", async function () {
    const clearVote = 1;
    const encryptedVote = await fhevm
      .createEncryptedInput(fheVotingContractAddress, signers.alice.address)
      .add32(clearVote)
      .encrypt();

    // Try to vote for invalid option 3
    await expect(
      fheVotingContract.connect(signers.alice).vote(3, encryptedVote.handles[0], encryptedVote.inputProof),
    ).to.be.revertedWith("Invalid option");
  });
});
