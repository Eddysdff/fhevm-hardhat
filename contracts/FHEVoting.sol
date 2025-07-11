// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A privacy-preserving voting contract using FHE
/// @notice This contract allows users to vote while keeping their votes encrypted
contract FHEVoting is SepoliaConfig {
    // 投票选项数量
    uint32 public constant NUM_OPTIONS = 3;

    // 加密的投票计数 [选项0, 选项1, 选项2]
    euint32[NUM_OPTIONS] private _voteCounts;

    // 记录用户是否已经投票
    mapping(address => bool) private _hasVoted;

    // 投票事件
    event VoteCast(address indexed voter, uint32 option);
    event VoteRevealed(uint32 option, uint32 totalVotes);

    /// @notice 获取指定选项的加密投票数
    /// @param option 投票选项 (0, 1, 或 2)
    /// @return 加密的投票数
    function getVoteCount(uint32 option) external view returns (euint32) {
        require(option < NUM_OPTIONS, "Invalid option");
        return _voteCounts[option];
    }

    /// @notice 进行加密投票
    /// @param option 投票选项 (0, 1, 或 2)
    /// @param encryptedVote 加密的投票值
    /// @param proof 投票证明
    function vote(uint32 option, externalEuint32 encryptedVote, bytes calldata proof) external {
        require(option < NUM_OPTIONS, "Invalid option");
        require(!_hasVoted[msg.sender], "Already voted");

        // 将外部加密值转换为内部格式
        euint32 vote = FHE.fromExternal(encryptedVote, proof);

        // 注意：在fHEVM中，投票值的验证通常在客户端进行
        // 这里我们假设传入的加密值已经是有效的投票值

        // 增加该选项的投票数
        _voteCounts[option] = FHE.add(_voteCounts[option], vote);

        // 标记用户已投票
        _hasVoted[msg.sender] = true;

        // 允许合约和投票者访问新的投票计数
        FHE.allowThis(_voteCounts[option]);
        FHE.allow(_voteCounts[option], msg.sender);

        emit VoteCast(msg.sender, option);
    }

    /// @notice 检查用户是否已经投票
    /// @param voter 投票者地址
    /// @return 是否已投票
    function hasVoted(address voter) external view returns (bool) {
        return _hasVoted[voter];
    }

    /// @notice 获取所有选项的加密投票数
    /// @return 加密投票数数组
    function getAllVoteCounts() external returns (euint32[NUM_OPTIONS] memory) {
        return _voteCounts;
    }

    /// @notice 计算总投票数（加密计算）
    /// @return 加密的总投票数
    function getTotalVotes() external returns (euint32) {
        euint32 total = FHE.asEuint32(0);
        for (uint32 i = 0; i < NUM_OPTIONS; i++) {
            total = FHE.add(total, _voteCounts[i]);
        }
        return total;
    }
}
